---
title: The bGUI Unity GUI Wrapper
description: Build in-game uGUI from code with the builder-styled bGUI library, plus a full from-scratch phone-app UI example and an animated-GIF-to-texture helper.
sidebar:
  order: 5
---

Not every UI needs an AssetBundle. Many mods build their interface as runtime-created **uGUI** in code,
which avoids the whole bundle pipeline - the trade-off is a lot of repetitive `GameObject` /
`RectTransform` / `AddComponent` boilerplate. This page covers a library that hides that boilerplate,
a full worked example of doing it by hand, and a bonus helper for animated textures.

## bGUI: builder-styled uGUI

[ifBars/bGUI](https://github.com/ifBars/bGUI) is a builder-styled wrapper over uGUI for runtime-created
UI that is easy to manage. It grew out of repeating the same UI code across mods, and was inspired by the
builder-styled classes S1API uses for NPC appearances.

Usage:

- Add `bGUI` as an assembly reference in your mod project.
- Build your UI elements through `bGUI`.
- Drop `bGUI.dll` into your `userLibs` when you run the game so your mod can load it.

It is MIT-licensed and open to PRs. There is no docs site yet, but most classes carry XML comments and
the repo ships sample mods. It is a work in progress (dropdowns especially), with a planned split into a
core uGUI-components namespace and a higher-level component library (cards, toggle groups, panel presets
like "pages").

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1413665702900142210/1413665702900142210)

## Building uGUI by hand: a full app example

If you would rather understand the raw pattern (or you are not using bGUI), Deeej shared a complete phone
app UI built entirely in code. It is a good reference for the shape of a from-scratch uGUI screen:

- `InitializeUI` takes the app's container `RectTransform` and wires up callbacks.
- A top bar holds a title and a live clock, driven by subscribing to `TimeManager.onMinutePass`.
- A main content area uses a `HorizontalLayoutGroup` to split into a scrolling list panel (left) and a
  detail panel (right).
- `CreateDetailLine` is a small helper that lays out a label / stretching divider / value row.
- List items are buttons that fire a selection callback.

:::caution[Mono, and verbose]
This targets the **Mono** branch (`ScheduleOne.*` namespaces, `MelonLogger`). The author notes it was
written with an LLM and is heavy on `MelonLogger` debug calls - treat it as a layout reference to adapt,
not a drop-in. The IL2CPP equivalent needs `Il2Cpp` types and interop care.
:::

```csharp
﻿using UnityEngine;
using UnityEngine.UI;
using MelonLoader;
using TMPro;
using ScheduleOne.GameTime;
using ScheduleOne.DevUtilities;

namespace CallVehicle.Phone
{
    public class AppUI
    {
        private readonly Color bgColor = new Color32(45, 55, 72, 255);
        private readonly Color panelColor = new Color32(55, 65, 82, 255);
        private readonly Color textColor = new Color32(226, 232, 240, 255);
        private readonly Color accentColor = new Color32(56, 178, 172, 255);
        private readonly Color buttonTextColor = new Color32(226, 232, 240, 255);
        private readonly Color fadedLineColor = new Color32(226, 232, 240, 100);

        public TextMeshProUGUI TimeText { get; private set; }
        public GameObject OverviewInitialPanel { get; private set; }
        public GameObject OverviewDetailPanel { get; private set; }
        public TextMeshProUGUI OverviewNameText { get; private set; }
        public TextMeshProUGUI OverviewIdText { get; private set; }
        public TextMeshProUGUI OverviewDistanceText { get; private set; }
        public TextMeshProUGUI OverviewColorText { get; private set; }
        public TextMeshProUGUI CostPricePerKmText { get; private set; }
        public TextMeshProUGUI CostServiceChargeText { get; private set; }
        public TextMeshProUGUI CostTotalCostText { get; private set; }
        public Button CallVehicleButton { get; private set; }
        public ScrollRect ListScrollRect { get; private set; }
        public Transform ListViewContent { get; private set; }

        private RectTransform parentContainer;
        private Action<EntryData?> entrySelectedCallback;
        private Action callVehicleCallback;

        private const float TOP_BAR_HEIGHT = 45f;
        private const float HORIZONTAL_PADDING = 10f;
        private const float VERTICAL_PADDING = 10f;

        /// <summary>
        /// Creates all UI elements for the GenericApp.
        /// </summary>
        public void InitializeUI(RectTransform container, Action<EntryData?> onEntrySelected, Action onCallVehicle)
        {
            if (container == null)
            {
                MelonLogger.Error("AppUI: Initialization failed - Parent container is null!");
                return;
            }
            this.parentContainer = container;
            this.entrySelectedCallback = onEntrySelected;
            this.callVehicleCallback = onCallVehicle;

            Image bgImage = parentContainer.GetComponent<Image>();
            if (bgImage == null) bgImage = parentContainer.gameObject.AddComponent<Image>();
            bgImage.color = bgColor;
            bgImage.raycastTarget = true;

            CreateTopBar();
            TimeManager timeManager = NetworkSingleton<TimeManager>.Instance;
            timeManager.onMinutePass = (Action)Delegate.Combine(timeManager.onMinutePass, new Action(this.MinPass));
            CreateMainContentArea();

            MelonLogger.Msg("AppUI: UI Initialization complete.");
        }

        private void CreateTopBar()
        {
            // ... (No changes needed in CreateTopBar) ...
            // Create an outer container for padding
            GameObject topBarOuterContainerGO = new GameObject("TopBarContainer");
            topBarOuterContainerGO.transform.SetParent(parentContainer, false);
            RectTransform topBarOuterRect = topBarOuterContainerGO.AddComponent<RectTransform>();
            topBarOuterRect.anchorMin = new Vector2(0, 1); topBarOuterRect.anchorMax = new Vector2(1, 1);
            topBarOuterRect.pivot = new Vector2(0.5f, 1);
            topBarOuterRect.sizeDelta = new Vector2(-(HORIZONTAL_PADDING * 2), TOP_BAR_HEIGHT);
            topBarOuterRect.anchoredPosition = new Vector2(0, 0);
            topBarOuterRect.localScale = Vector3.one;

            // Create the actual Top Bar with background color inside the padded container
            GameObject topBarGO = new GameObject("TopBar");
            topBarGO.transform.SetParent(topBarOuterRect, false);
            Image topBarBg = topBarGO.AddComponent<Image>();
            topBarBg.color = panelColor;
            RectTransform topBarRect = topBarGO.GetComponent<RectTransform>();
            topBarRect.anchorMin = Vector2.zero; topBarRect.anchorMax = Vector2.one;
            topBarRect.sizeDelta = Vector2.zero; topBarRect.anchoredPosition = Vector2.zero;
            topBarRect.localScale = Vector3.one;

            // --- Top Bar Content ---

            // Title Text (Left Anchored)
            GameObject titleGO = new GameObject("TitleText");
            titleGO.transform.SetParent(topBarGO.transform, false);
            // Use TextMeshProUGUI
            TextMeshProUGUI titleText = titleGO.AddComponent<TextMeshProUGUI>();
            titleText.text = "Call Vehicle";
            // Font assignment removed - TMP uses Font Assets
            titleText.fontSize = 20;
            titleText.color = textColor;
            // Use TMP alignment
            titleText.alignment = TextAlignmentOptions.MidlineLeft;
            RectTransform titleRect = titleGO.GetComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0, 0.5f); titleRect.anchorMax = new Vector2(0, 0.5f);
            titleRect.pivot = new Vector2(0, 0.5f);
            titleRect.sizeDelta = new Vector2(300, TOP_BAR_HEIGHT * 0.8f);
            titleRect.anchoredPosition = new Vector2(15, 0);

            // Time Text (Right Anchored)
            GameObject timeGO = new GameObject("TimeText");
            timeGO.transform.SetParent(topBarGO.transform, false);
            // Use TextMeshProUGUI and assign to public property
            this.TimeText = timeGO.AddComponent<TextMeshProUGUI>();
            this.TimeText.fontSize = 18;
            this.TimeText.color = textColor;
            // Use TMP alignment
            this.TimeText.alignment = TextAlignmentOptions.MidlineRight;
            RectTransform timeRect = timeGO.GetComponent<RectTransform>();
            timeRect.anchorMin = new Vector2(1, 0.5f); timeRect.anchorMax = new Vector2(1, 0.5f);
            timeRect.pivot = new Vector2(1, 0.5f);
            timeRect.sizeDelta = new Vector2(110, TOP_BAR_HEIGHT * 0.8f);
            timeRect.anchoredPosition = new Vector2(-15, 0);
        }

        private void MinPass()
        {
            if (NetworkSingleton<GameManager>.Instance.IsTutorial)
            {
                int num = TimeManager.Get24HourTimeFromMinSum(Mathf.RoundToInt(Mathf.Round((float)NetworkSingleton<TimeManager>.Instance.DailyMinTotal / 60f) * 60f));
                this.TimeText.text = TimeManager.Get12HourTime((float)num, true) + " " + NetworkSingleton<TimeManager>.Instance.CurrentDay.ToString();
                return;
            }
            this.TimeText.text = TimeManager.Get12HourTime((float)NetworkSingleton<TimeManager>.Instance.CurrentTime, true) + " " + NetworkSingleton<TimeManager>.Instance.CurrentDay.ToString();
        }

        private void CreateMainContentArea()
        {
            GameObject mainAreaGO = new GameObject("MainContentArea");
            mainAreaGO.transform.SetParent(parentContainer, false);
            RectTransform mainAreaRect = mainAreaGO.AddComponent<RectTransform>();
            mainAreaRect.anchorMin = Vector2.zero; mainAreaRect.anchorMax = Vector2.one;
            mainAreaRect.pivot = new Vector2(0.5f, 0.5f);
            mainAreaRect.offsetMin = new Vector2(HORIZONTAL_PADDING, VERTICAL_PADDING);
            mainAreaRect.offsetMax = new Vector2(-HORIZONTAL_PADDING, -(TOP_BAR_HEIGHT + VERTICAL_PADDING));
            mainAreaRect.localScale = Vector3.one;

            HorizontalLayoutGroup mainLayout = mainAreaGO.AddComponent<HorizontalLayoutGroup>();
            mainLayout.padding = new RectOffset(0, 0, 0, 0);
            mainLayout.spacing = 15;
            mainLayout.childAlignment = TextAnchor.UpperLeft;
            mainLayout.childControlHeight = true; mainLayout.childControlWidth = true;
            mainLayout.childForceExpandHeight = true; mainLayout.childForceExpandWidth = true;

            CreateLeftPanel(mainAreaGO.transform);
            CreateRightPanel(mainAreaGO.transform);
        }

        private void CreateLeftPanel(Transform parent)
        {
            MelonLogger.Msg("AppUI: CreateLeftPanel - Starting.");
            this.ListViewContent = null;
            GameObject listViewContentGO = null;
            RectTransform contentRect = null;
            RectTransform scrollRectTransform = null;

            try
            {
                MelonLogger.Msg("AppUI: CreateLeftPanel - Creating scrollViewGO...");
                GameObject scrollViewGO = new GameObject("ListViewScrollView");
                if (scrollViewGO == null) { MelonLogger.Error("AppUI: CreateLeftPanel - scrollViewGO is NULL after creation!"); return; }

                scrollRectTransform = scrollViewGO.GetComponent<RectTransform>();
                if (scrollRectTransform == null)
                {
                    MelonLogger.Msg("AppUI: CreateLeftPanel - Adding RectTransform to scrollViewGO...");
                    scrollRectTransform = scrollViewGO.AddComponent<RectTransform>();
                }
                if (scrollRectTransform == null) { MelonLogger.Error("AppUI: CreateLeftPanel - Failed to get/add RectTransform for scrollViewGO!"); return; }

                scrollViewGO.transform.SetParent(parent, false);
                MelonLogger.Msg("AppUI: CreateLeftPanel - Parented scrollViewGO.");

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding Image to scrollViewGO...");
                Image scrollBg = scrollViewGO.AddComponent<Image>();
                if (scrollBg == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add Image to scrollViewGO."); else scrollBg.color = panelColor;

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding Mask to scrollViewGO...");
                Mask scrollMask = scrollViewGO.AddComponent<Mask>();
                if (scrollMask == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add Mask to scrollViewGO."); else scrollMask.showMaskGraphic = false;

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding LayoutElement to scrollViewGO...");
                LayoutElement scrollLayout = scrollViewGO.AddComponent<LayoutElement>();
                if (scrollLayout == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add LayoutElement to scrollViewGO."); else scrollLayout.flexibleWidth = 1;
                MelonLogger.Msg("AppUI: CreateLeftPanel - Configured ScrollView GO.");

                MelonLogger.Msg("AppUI: CreateLeftPanel - Creating listViewContentGO...");
                listViewContentGO = new GameObject("ListViewContent");
                if (listViewContentGO == null) { MelonLogger.Error("AppUI: CreateLeftPanel - listViewContentGO is NULL after creation!"); return; }

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding RectTransform to listViewContentGO (BEFORE PARENTING)...");
                contentRect = listViewContentGO.AddComponent<RectTransform>();
                if (contentRect == null)
                {
                    MelonLogger.Error("AppUI: CreateLeftPanel - Failed to add RectTransform to listViewContentGO!");
                    GameObject.Destroy(listViewContentGO); 
                    return;
                }
                else
                {
                    MelonLogger.Msg("AppUI: CreateLeftPanel - Added RectTransform to listViewContentGO successfully.");

                    contentRect.anchorMin = new Vector2(0, 1); contentRect.anchorMax = new Vector2(1, 1);
                    contentRect.pivot = new Vector2(0.5f, 1); contentRect.sizeDelta = Vector2.zero;
                    contentRect.localScale = Vector3.one;
                }

                MelonLogger.Msg("AppUI: CreateLeftPanel - Assigning transform to ListViewContent property (BEFORE PARENTING)...");
                this.ListViewContent = listViewContentGO.transform;
                MelonLogger.Msg($"AppUI: CreateLeftPanel - Assigned ListViewContent. Is it null NOW? {(this.ListViewContent == null)}");

                MelonLogger.Msg("AppUI: CreateLeftPanel - Parenting listViewContentGO...");
                listViewContentGO.transform.SetParent(scrollViewGO.transform, false);
                MelonLogger.Msg($"AppUI: CreateLeftPanel - Parented listViewContentGO. Is ListViewContent null after parenting? {(this.ListViewContent == null)}");

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding VerticalLayoutGroup to listViewContentGO...");
                VerticalLayoutGroup contentLayout = listViewContentGO.AddComponent<VerticalLayoutGroup>();
                if (contentLayout == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add VerticalLayoutGroup to listViewContentGO.");
                else
                {
                    contentLayout.padding = new RectOffset(8, 8, 8, 8); contentLayout.spacing = 8;
                    contentLayout.childAlignment = TextAnchor.UpperCenter; contentLayout.childControlHeight = true;
                    contentLayout.childControlWidth = true; contentLayout.childForceExpandHeight = false;
                    contentLayout.childForceExpandWidth = true;
                }
                MelonLogger.Msg($"AppUI: CreateLeftPanel - Added VLG. Is ListViewContent null? {(this.ListViewContent == null)}");


                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding ContentSizeFitter to listViewContentGO...");
                ContentSizeFitter sizeFitter = listViewContentGO.AddComponent<ContentSizeFitter>();
                if (sizeFitter == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add ContentSizeFitter to listViewContentGO."); else sizeFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                MelonLogger.Msg($"AppUI: CreateLeftPanel - Added Fitter. Is ListViewContent null? {(this.ListViewContent == null)}");

                MelonLogger.Msg("AppUI: CreateLeftPanel - Adding ScrollRect to scrollViewGO...");
                if (contentRect != null && scrollRectTransform != null)
                {
                    this.ListScrollRect = scrollViewGO.AddComponent<ScrollRect>();
                    if (this.ListScrollRect == null) MelonLogger.Warning("AppUI: CreateLeftPanel - Failed to add ScrollRect to scrollViewGO.");
                    else
                    {
                        this.ListScrollRect.content = contentRect; 
                        this.ListScrollRect.viewport = scrollRectTransform; 
                        this.ListScrollRect.horizontal = false; this.ListScrollRect.vertical = true;
                        this.ListScrollRect.movementType = ScrollRect.MovementType.Clamped;
                    }
                }
                else
                {
                    MelonLogger.Error("AppUI: CreateLeftPanel - Cannot add ScrollRect because contentRect or scrollRectTransform is null!");
                }

                MelonLogger.Msg($"AppUI: CreateLeftPanel - Finished setup. Is ListViewContent null at end? {(this.ListViewContent == null)}");
            }
            catch (Exception ex)
            {
                MelonLogger.Error($"AppUI: CreateLeftPanel - EXCEPTION: {ex.ToString()}");
                this.ListViewContent = null;
                MelonLogger.Error("AppUI: CreateLeftPanel - ListViewContent set to null due to exception.");
            }
        }

        private void CreateRightPanel(Transform parent)
        {
            GameObject rightPanelGO = new GameObject("OverviewPanel");
            rightPanelGO.transform.SetParent(parent, false);
            Image panelBg = rightPanelGO.AddComponent<Image>();
            panelBg.color = panelColor;
            RectTransform panelRect = rightPanelGO.GetComponent<RectTransform>();
            LayoutElement panelLayout = rightPanelGO.AddComponent<LayoutElement>();
            panelLayout.flexibleWidth = 1; 

            GameObject contentContainer = new GameObject("OverviewContentContainer");
            contentContainer.transform.SetParent(panelRect, false);
            RectTransform contentContainerRect = contentContainer.AddComponent<RectTransform>();
            contentContainerRect.anchorMin = Vector2.zero; contentContainerRect.anchorMax = Vector2.one;
            contentContainerRect.offsetMin = new Vector2(10, 10);
            contentContainerRect.offsetMax = new Vector2(-10, -10);
            contentContainerRect.localScale = Vector3.one;

            this.OverviewInitialPanel = new GameObject("OverviewInitialPanel");
            this.OverviewInitialPanel.transform.SetParent(contentContainerRect, false);
            RectTransform initialRect = this.OverviewInitialPanel.AddComponent<RectTransform>();
            initialRect.anchorMin = Vector2.zero; initialRect.anchorMax = Vector2.one;
            initialRect.offsetMin = Vector2.zero; initialRect.offsetMax = Vector2.zero;

            VerticalLayoutGroup initialLayout = this.OverviewInitialPanel.AddComponent<VerticalLayoutGroup>();
            initialLayout.padding = new RectOffset(5, 5, 5, 5); initialLayout.spacing = 8;
            initialLayout.childAlignment = TextAnchor.UpperCenter; initialLayout.childControlHeight = false;
            initialLayout.childControlWidth = true; initialLayout.childForceExpandHeight = false;
            initialLayout.childForceExpandWidth = true;

            GameObject initialTitleGO = new GameObject("InitialTitle");
            initialTitleGO.transform.SetParent(initialLayout.transform, false);

            TextMeshProUGUI initialTitleText = initialTitleGO.AddComponent<TextMeshProUGUI>();
            initialTitleText.text = "Entry overview";
            initialTitleText.fontSize = 18;
            initialTitleText.color = textColor;

            initialTitleText.alignment = TextAlignmentOptions.Center;
            LayoutElement initialTitleLayout = initialTitleGO.AddComponent<LayoutElement>();
            initialTitleLayout.minHeight = 30;

            GameObject initialTextGO = new GameObject("InitialText");
            initialTextGO.transform.SetParent(initialLayout.transform, false);

            TextMeshProUGUI initialText = initialTextGO.AddComponent<TextMeshProUGUI>();
            initialText.text = "Select an entry";
            initialText.fontSize = 20;
            initialText.color = textColor;

            initialText.alignment = TextAlignmentOptions.Center;
            initialText.fontStyle = FontStyles.Italic; // Use TMP FontStyles
            LayoutElement initialTextLayout = initialTextGO.AddComponent<LayoutElement>();
            initialTextLayout.minHeight = 60;
            initialTextLayout.flexibleHeight = 1;

            this.OverviewDetailPanel = new GameObject("OverviewDetailPanel");
            this.OverviewDetailPanel.transform.SetParent(contentContainerRect, false);
            RectTransform detailRect = this.OverviewDetailPanel.AddComponent<RectTransform>();
            detailRect.anchorMin = Vector2.zero; detailRect.anchorMax = Vector2.one;
            detailRect.offsetMin = Vector2.zero; detailRect.offsetMax = Vector2.zero;

            GameObject detailTitleGO = new GameObject("DetailTitle");
            detailTitleGO.transform.SetParent(detailRect, false);

            TextMeshProUGUI detailTitleText = detailTitleGO.AddComponent<TextMeshProUGUI>();
            detailTitleText.text = "Entry overview";
            detailTitleText.fontSize = 18;
            detailTitleText.color = textColor;

            detailTitleText.alignment = TextAlignmentOptions.Center;
            RectTransform detailTitleRect = detailTitleGO.GetComponent<RectTransform>();
            detailTitleRect.anchorMin = new Vector2(0, 1); detailTitleRect.anchorMax = new Vector2(1, 1);
            detailTitleRect.pivot = new Vector2(0.5f, 1); detailTitleRect.sizeDelta = new Vector2(0, 30);
            detailTitleRect.anchoredPosition = new Vector2(0, -5);

            float detailLineStartY = 35f;

            this.OverviewNameText = CreateDetailLine(detailRect, "Name", 0, detailLineStartY);
            this.OverviewIdText = CreateDetailLine(detailRect, "ID", 1, detailLineStartY);
            this.OverviewDistanceText = CreateDetailLine(detailRect, "Distance", 2, detailLineStartY);
            this.OverviewColorText = CreateDetailLine(detailRect, "Color", 3, detailLineStartY);

            float costBreakdownLineStartY = 220f;
            GameObject detailTextGO = new GameObject("CostBreakdownTitle");
            detailTextGO.transform.SetParent(detailRect, false);
            TextMeshProUGUI detailText = detailTextGO.AddComponent<TextMeshProUGUI>();
            detailText.text = "Cost breakdown";
            detailText.fontSize = 18;
            detailText.color = textColor;

            detailText.alignment = TextAlignmentOptions.Center;
            RectTransform detailTextRect = detailTextGO.GetComponent<RectTransform>();
            detailTextRect.anchorMin = new Vector2(0, 1); detailTextRect.anchorMax = new Vector2(1, 1);
            detailTextRect.pivot = new Vector2(0.5f, 1);
            detailTextRect.sizeDelta = new Vector2(0, 30);
            detailTextRect.anchoredPosition = new Vector2(0, -185f);
            this.CostPricePerKmText = CreateDetailLine(detailRect, "Price per km", 0, costBreakdownLineStartY);
            this.CostServiceChargeText = CreateDetailLine(detailRect, "Service charge", 1, costBreakdownLineStartY);
            this.CostTotalCostText = CreateDetailLine(detailRect, "Total Cost (rounded)", 2, costBreakdownLineStartY, true);

            GameObject callButtonGO = new GameObject("CallVehicleButton");
            callButtonGO.transform.SetParent(detailRect, false);

            Image callButtonBg = callButtonGO.AddComponent<Image>();
            callButtonBg.color = accentColor;
            this.CallVehicleButton = callButtonGO.AddComponent<Button>();

            RectTransform callButtonRect = callButtonGO.GetComponent<RectTransform>();
            callButtonRect.anchorMin = new Vector2(1, 0);
            callButtonRect.anchorMax = new Vector2(1, 0);
            callButtonRect.pivot = new Vector2(1, 0);

            callButtonRect.sizeDelta = new Vector2(180, 32);
            callButtonRect.anchoredPosition = new Vector2(-5, 5);
            callButtonRect.localScale = Vector3.one;

            GameObject callButtonTextGO = new GameObject("Text");
            callButtonTextGO.transform.SetParent(callButtonGO.transform, false);

            TextMeshProUGUI callButtonText = callButtonTextGO.AddComponent<TextMeshProUGUI>();

            callButtonText.text = "Call Vehicle >";
            callButtonText.fontSize = 20;
            callButtonText.fontStyle = FontStyles.Bold;
            callButtonText.color = buttonTextColor;

            callButtonText.alignment = TextAlignmentOptions.Center;
            RectTransform callTextRect = callButtonTextGO.GetComponent<RectTransform>();
            callTextRect.anchorMin = Vector2.zero; callTextRect.anchorMax = Vector2.one;
            callTextRect.offsetMin = Vector2.zero; callTextRect.offsetMax = Vector2.zero;

            this.CallVehicleButton.onClick.AddListener(() => { if (callVehicleCallback != null) callVehicleCallback(); });

            this.OverviewDetailPanel.SetActive(false);
        }
        private TextMeshProUGUI CreateDetailLine(RectTransform parent, string label, int index, float startY, bool boldValue = false)
        {
            float lineHeight = 30f;
            float spacing = 8f;

            GameObject lineGO = new GameObject(label.Replace(":", "") + "Line");
            lineGO.transform.SetParent(parent, false);
            RectTransform lineRect = lineGO.AddComponent<RectTransform>();

            lineRect.anchorMin = new Vector2(0, 1);
            lineRect.anchorMax = new Vector2(1, 1);
            lineRect.pivot = new Vector2(0.5f, 1);
            lineRect.anchoredPosition = new Vector2(0, -(startY + index * (lineHeight + spacing)));
            lineRect.sizeDelta = new Vector2(0, lineHeight);
            lineRect.localScale = Vector3.one;

            HorizontalLayoutGroup lineLayout = lineGO.AddComponent<HorizontalLayoutGroup>();
            lineLayout.padding = new RectOffset(0, 0, 0, 0);
            lineLayout.spacing = 8;
            lineLayout.childControlHeight = true;
            lineLayout.childControlWidth = true;
            lineLayout.childForceExpandHeight = false;
            lineLayout.childForceExpandWidth = false;

            lineLayout.childAlignment = TextAnchor.MiddleCenter;

            GameObject labelGO = new GameObject("Label");
            labelGO.transform.SetParent(lineLayout.transform, false);
            TextMeshProUGUI labelText = labelGO.AddComponent<TextMeshProUGUI>();
            labelText.text = label;
            labelText.fontSize = 18;
            labelText.fontStyle = FontStyles.Bold;
            labelText.color = textColor;
            labelText.alignment = TextAlignmentOptions.MidlineLeft;

            GameObject lineImageGO = new GameObject("StretchingLine");
            lineImageGO.transform.SetParent(lineLayout.transform, false);
            Image lineImage = lineImageGO.AddComponent<Image>();
            lineImage.color = fadedLineColor;

            LayoutElement lineLayoutElement = lineImageGO.AddComponent<LayoutElement>();

            lineLayoutElement.flexibleWidth = 1;
            lineLayoutElement.minHeight = 1;
            lineLayoutElement.preferredHeight = 1;
            lineLayoutElement.flexibleHeight = 0;

            GameObject valueGO = new GameObject("Value");
            valueGO.transform.SetParent(lineLayout.transform, false);
            TextMeshProUGUI valueText = valueGO.AddComponent<TextMeshProUGUI>();
            valueText.text = "-";
            valueText.fontSize = 18;
            valueText.color = textColor;
            valueText.alignment = TextAlignmentOptions.MidlineRight;
            valueText.fontStyle = boldValue ? FontStyles.Bold : FontStyles.Normal;

            return valueText;
        }

        /// <summary>
        /// Removes all existing items from the list view.
        /// </summary>
        public void ClearListItems()
        {
            if (ListViewContent == null)
            {
                // Changed to Error for higher visibility
                MelonLogger.Error("AppUI: Cannot clear list items, ListViewContent is null.");
                return;
            }
            MelonLogger.Msg($"AppUI: Clearing list items from {ListViewContent.name}. Child count: {ListViewContent.childCount}"); // Log before clearing

            // Destroy existing children
            // Use a loop that accounts for removing items while iterating
            for (int i = ListViewContent.childCount - 1; i >= 0; i--)
            {
                Transform child = ListViewContent.GetChild(i);
                if (child != null)
                {
                    // Use DestroyImmediate if Destroy doesn't work fast enough before repopulation
                    UnityEngine.Object.Destroy(child.gameObject);
                }
            }
            MelonLogger.Msg($"AppUI: Finished clearing list items. Remaining children: {ListViewContent.childCount}"); // Log after clearing
        }

        /// <summary>
        /// Creates and adds a single list item UI element.
        /// </summary>
        /// <param name="entryData">The data for the list item.</param>
        public void AddListItem(EntryData entryData)
        {
            if (ListViewContent == null)
            {
                MelonLogger.Error($"AppUI: Cannot add list item '{entryData.Name}', ListViewContent is null.");
                return;
            }

            GameObject itemGO = new GameObject($"ListItem_{entryData.Name}");
            itemGO.transform.SetParent(ListViewContent, false);

            Image itemImage = itemGO.AddComponent<Image>();
            itemImage.color = bgColor;

            Button itemButton = itemGO.AddComponent<Button>();
            Navigation nav = itemButton.navigation;
            nav.mode = Navigation.Mode.None;
            itemButton.navigation = nav;

            LayoutElement layoutElement = itemGO.AddComponent<LayoutElement>();
            layoutElement.minHeight = 35;

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(itemGO.transform, false);
            TextMeshProUGUI itemText = textGO.AddComponent<TextMeshProUGUI>();
            itemText.text = entryData.Name;
            itemText.fontSize = 16;
            itemText.color = textColor;
            itemText.alignment = TextAlignmentOptions.MidlineLeft;

            RectTransform textRect = textGO.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero; textRect.anchorMax = Vector2.one;
            textRect.offsetMin = new Vector2(10, 4);
            textRect.offsetMax = new Vector2(-10, -4);

            itemButton.onClick.AddListener(() => {
                if (entrySelectedCallback != null) entrySelectedCallback(entryData);
            });
        }
    }
}
```

> Source: **Deeej** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1363544476366274831)

## Bonus: animated GIF textures

For animated imagery - think animated icons or profile pictures - chi chi shared a self-contained GIF
decoder. `UnityGif.GetTextureListCoroutine` turns a GIF's raw bytes into a list of `Texture2D` frames
(each with a delay), which you then flip through yourself. The example `GifToTexture` `MonoBehaviour` at
the top shows the whole loop: read the file, decode, then advance frames in `Update` and copy the current
frame onto a target texture or material.

It is plain Unity code and works the same in a bundle or a runtime UI. Add the usual usings it relies on
(`System`, `System.Collections`, `System.Collections.Generic`, `System.IO`, `System.Text`,
`UnityEngine`); in normal use you only touch the `GifToTexture` example - the rest is the GIF-format
decoder.

```csharp
// Example
public class GifToTexture : MonoBehaviour
{
    public string gifFilePath;            // Full path to the GIF
    public Texture2D targetTexture;       // Texture2D to update
    public Material targetMaterial;       // Optional: apply to a material too

    private List<UnityGif.GifTexture> gifFrames;
    private int currentFrame;
    private float timer;
    private bool isPlaying;

    void Start()
    {
        StartCoroutine(LoadGifToTexture());
    }

    IEnumerator LoadGifToTexture()
    {
        if (!File.Exists(gifFilePath))
        {
            Debug.LogError("GIF file not found: " + gifFilePath);
            yield break;
        }

        byte[] gifBytes = File.ReadAllBytes(gifFilePath);

        yield return StartCoroutine(UnityGif.GetTextureListCoroutine(
            gifBytes,
            (frames, loopCount, width, height) =>
            {
                gifFrames = frames;
                isPlaying = true;
                currentFrame = 0;
                CopyToTarget(gifFrames[0].m_texture2d);
            }
        ));
    }

    void Update()
    {
        if (!isPlaying || gifFrames == null || gifFrames.Count == 0)
            return;

        timer += Time.deltaTime;
        if (timer >= gifFrames[currentFrame].m_delaySec)
        {
            timer = 0f;
            currentFrame = (currentFrame + 1) % gifFrames.Count;
            CopyToTarget(gifFrames[currentFrame].m_texture2d);
        }
    }

    void CopyToTarget(Texture2D source)
    {
        if (targetTexture != null)
        {
            Graphics.CopyTexture(source, targetTexture);
        }

        if (targetMaterial != null)
        {
            targetMaterial.mainTexture = targetTexture;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

public static class UnityGif
{
    /// <summary>
    /// Get GIF texture list Coroutine
    /// </summary>
    /// <param name="bytes">GIF file byte data</param>
    /// <param name="callback">Callback method(param is GIF texture list, Animation loop count, GIF image width (px), GIF image height (px))</param>
    /// <param name="filterMode">Textures filter mode</param>
    /// <param name="wrapMode">Textures wrap mode</param>
    /// <param name="debugLog">Debug Log Flag</param>
    /// <returns>IEnumerator</returns>
    public static IEnumerator GetTextureListCoroutine(
        byte[] bytes,
        Action<List<GifTexture>, int, int, int> callback,
        FilterMode filterMode = FilterMode.Bilinear,
        TextureWrapMode wrapMode = TextureWrapMode.Clamp,
        bool debugLog = false)
    {
        int loopCount = -1;
        int width = 0;
        int height = 0;

        // Set GIF data
        var gifData = new GifData();
        if (SetGifData(bytes, ref gifData, debugLog) == false)
        {
            Debug.LogError("GIF file data set error.");
            if (callback != null)
            {
                callback(null, loopCount, width, height);
            }
            yield break;
        }

        // Decode to textures from GIF data
        List<GifTexture> gifTexList = null;
        yield return DecodeTextureCoroutine(gifData, result => gifTexList = result, filterMode, wrapMode);

        if (gifTexList == null || gifTexList.Count <= 0)
        {
            Debug.LogError("GIF texture decode error.");
            if (callback != null)
            {
                callback(null, loopCount, width, height);
            }
            yield break;
        }

        loopCount = gifData.m_appEx.loopCount;
        width = gifData.m_logicalScreenWidth;
        height = gifData.m_logicalScreenHeight;

        if (callback != null)
        {
            callback(gifTexList, loopCount, width, height);
        }

        yield break;
    }

    /// <summary>
    /// Gif Texture
    /// </summary>
    public class GifTexture
    {
        // Texture
        public Texture2D m_texture2d;
        // Delay time until the next texture.
        public float m_delaySec;

        public GifTexture(Texture2D texture2d, float delaySec)
        {
            m_texture2d = texture2d;
            m_delaySec = delaySec;
        }
    }

    /// <summary>
    /// GIF Data Format
    /// </summary>
    private struct GifData
    {
        // Signature
        public byte m_sig0, m_sig1, m_sig2;
        // Version
        public byte m_ver0, m_ver1, m_ver2;
        // Logical Screen Width
        public ushort m_logicalScreenWidth;
        // Logical Screen Height
        public ushort m_logicalScreenHeight;
        // Global Color Table Flag
        public bool m_globalColorTableFlag;
        // Color Resolution
        public int m_colorResolution;
        // Sort Flag
        public bool m_sortFlag;
        // Size of Global Color Table
        public int m_sizeOfGlobalColorTable;
        // Background Color Index
        public byte m_bgColorIndex;
        // Pixel Aspect Ratio
        public byte m_pixelAspectRatio;
        // Global Color Table
        public List<byte[]> m_globalColorTable;
        // ImageBlock
        public List<ImageBlock> m_imageBlockList;
        // GraphicControlExtension
        public List<GraphicControlExtension> m_graphicCtrlExList;
        // Comment Extension
        public List<CommentExtension> m_commentExList;
        // Plain Text Extension
        public List<PlainTextExtension> m_plainTextExList;
        // Application Extension
        public ApplicationExtension m_appEx;
        // Trailer
        public byte m_trailer;

        public string signature
        {
            get
            {
                char[] c = { (char)m_sig0, (char)m_sig1, (char)m_sig2 };
                return new string(c);
            }
        }

        public string version
        {
            get
            {
                char[] c = { (char)m_ver0, (char)m_ver1, (char)m_ver2 };
                return new string(c);
            }
        }

        public void Dump()
        {
            Debug.Log("GIF Type: " + signature + "-" + version);
            Debug.Log("Image Size: " + m_logicalScreenWidth + "x" + m_logicalScreenHeight);
            Debug.Log("Animation Image Count: " + m_imageBlockList.Count);
            Debug.Log("Animation Loop Count (0 is infinite): " + m_appEx.loopCount);
            if (m_graphicCtrlExList != null && m_graphicCtrlExList.Count > 0)
            {
                var sb = new StringBuilder("Animation Delay Time (1/100sec)");
                for (int i = 0; i < m_graphicCtrlExList.Count; i++)
                {
                    sb.Append(", ");
                    sb.Append(m_graphicCtrlExList[i].m_delayTime);
                }
                Debug.Log(sb.ToString());
            }
            Debug.Log("Application Identifier: " + m_appEx.applicationIdentifier);
            Debug.Log("Application Authentication Code: " + m_appEx.applicationAuthenticationCode);
        }
    }

    /// <summary>
    /// Image Block
    /// </summary>
    private struct ImageBlock
    {
        // Image Separator
        public byte m_imageSeparator;
        // Image Left Position
        public ushort m_imageLeftPosition;
        // Image Top Position
        public ushort m_imageTopPosition;
        // Image Width
        public ushort m_imageWidth;
        // Image Height
        public ushort m_imageHeight;
        // Local Color Table Flag
        public bool m_localColorTableFlag;
        // Interlace Flag
        public bool m_interlaceFlag;
        // Sort Flag
        public bool m_sortFlag;
        // Size of Local Color Table
        public int m_sizeOfLocalColorTable;
        // Local Color Table
        public List<byte[]> m_localColorTable;
        // LZW Minimum Code Size
        public byte m_lzwMinimumCodeSize;
        // Block Size & Image Data List
        public List<ImageDataBlock> m_imageDataList;

        public struct ImageDataBlock
        {
            // Block Size
            public byte m_blockSize;
            // Image Data
            public byte[] m_imageData;
        }
    }

    /// <summary>
    /// Graphic Control Extension
    /// </summary>
    private struct GraphicControlExtension
    {
        // Extension Introducer
        public byte m_extensionIntroducer;
        // Graphic Control Label
        public byte m_graphicControlLabel;
        // Block Size
        public byte m_blockSize;
        // Disposal Mothod
        public ushort m_disposalMethod;
        // Transparent Color Flag
        public bool m_transparentColorFlag;
        // Delay Time
        public ushort m_delayTime;
        // Transparent Color Index
        public byte m_transparentColorIndex;
        // Block Terminator
        public byte m_blockTerminator;
    }

    /// <summary>
    /// Comment Extension
    /// </summary>
    private struct CommentExtension
    {
        // Extension Introducer
        public byte m_extensionIntroducer;
        // Comment Label
        public byte m_commentLabel;
        // Block Size & Comment Data List
        public List<CommentDataBlock> m_commentDataList;

        public struct CommentDataBlock
        {
            // Block Size
            public byte m_blockSize;
            // Image Data
            public byte[] m_commentData;
        }
    }

    /// <summary>
    /// Plain Text Extension
    /// </summary>
    private struct PlainTextExtension
    {
        // Extension Introducer
        public byte m_extensionIntroducer;
        // Plain Text Label
        public byte m_plainTextLabel;
        // Block Size
        public byte m_blockSize;
        // Block Size & Plain Text Data List
        public List<PlainTextDataBlock> m_plainTextDataList;

        public struct PlainTextDataBlock
        {
            // Block Size
            public byte m_blockSize;
            // Plain Text Data
            public byte[] m_plainTextData;
        }
    }

    /// <summary>
    /// Application Extension
    /// </summary>
    private struct ApplicationExtension
    {
        // Extension Introducer
        public byte m_extensionIntroducer;
        // Extension Label
        public byte m_extensionLabel;
        // Block Size
        public byte m_blockSize;
        // Application Identifier
        public byte m_appId1, m_appId2, m_appId3, m_appId4, m_appId5, m_appId6, m_appId7, m_appId8;
        // Application Authentication Code
        public byte m_appAuthCode1, m_appAuthCode2, m_appAuthCode3;
        // Block Size & Application Data List
        public List<ApplicationDataBlock> m_appDataList;

        public struct ApplicationDataBlock
        {
            // Block Size
            public byte m_blockSize;
            // Application Data
            public byte[] m_applicationData;
        }

        public string applicationIdentifier
        {
            get
            {
                char[] c = { (char)m_appId1, (char)m_appId2, (char)m_appId3, (char)m_appId4, (char)m_appId5, (char)m_appId6, (char)m_appId7, (char)m_appId8 };
                return new string(c);
            }
        }

        public string applicationAuthenticationCode
        {
            get
            {
                char[] c = { (char)m_appAuthCode1, (char)m_appAuthCode2, (char)m_appAuthCode3 };
                return new string(c);
            }
        }

        public int loopCount
        {
            get
            {
                if (m_appDataList == null || m_appDataList.Count < 1 ||
                    m_appDataList[0].m_applicationData.Length < 3 ||
                    m_appDataList[0].m_applicationData[0] != 0x01)
                {
                    return 0;
                }
                return BitConverter.ToUInt16(m_appDataList[0].m_applicationData, 1);
            }
        }
    }

    /// <summary>
    /// Decode to textures from GIF data
    /// </summary>
    /// <param name="gifData">GIF data</param>
    /// <param name="callback">Callback method(param is GIF texture list)</param>
    /// <param name="filterMode">Textures filter mode</param>
    /// <param name="wrapMode">Textures wrap mode</param>
    /// <returns>IEnumerator</returns>
    private static IEnumerator DecodeTextureCoroutine(GifData gifData, Action<List<GifTexture>> callback, FilterMode filterMode, TextureWrapMode wrapMode)
    {
        if (gifData.m_imageBlockList == null || gifData.m_imageBlockList.Count < 1)
        {
            yield break;
        }

        List<GifTexture> gifTexList = new List<GifTexture>(gifData.m_imageBlockList.Count);
        List<ushort> disposalMethodList = new List<ushort>(gifData.m_imageBlockList.Count);

        int imgIndex = 0;

        for (int i = 0; i < gifData.m_imageBlockList.Count; i++)
        {
            byte[] decodedData = GetDecodedData(gifData.m_imageBlockList[i]);

            GraphicControlExtension? graphicCtrlEx = GetGraphicCtrlExt(gifData, imgIndex);

            int transparentIndex = GetTransparentIndex(graphicCtrlEx);

            disposalMethodList.Add(GetDisposalMethod(graphicCtrlEx));

            Color32 bgColor;
            List<byte[]> colorTable = GetColorTableAndSetBgColor(gifData, gifData.m_imageBlockList[i], transparentIndex, out bgColor);

            yield return 0;

            bool filledTexture;
            Texture2D tex = CreateTexture2D(gifData, gifTexList, imgIndex, disposalMethodList, bgColor, filterMode, wrapMode, out filledTexture);

            yield return 0;

            // Set pixel data
            int dataIndex = 0;
            // Reverse set pixels. because GIF data starts from the top left.
            for (int y = tex.height - 1; y >= 0; y--)
            {
                SetTexturePixelRow(tex, y, gifData.m_imageBlockList[i], decodedData, ref dataIndex, colorTable, bgColor, transparentIndex, filledTexture);
            }
            tex.Apply();

            yield return 0;

            float delaySec = GetDelaySec(graphicCtrlEx);

            // Add to GIF texture list
            gifTexList.Add(new GifTexture(tex, delaySec));

            imgIndex++;
        }

        if (callback != null)
        {
            callback(gifTexList);
        }

        yield break;
    }

    #region Call from DecodeTexture methods

    /// <summary>
    /// Get decoded image data from ImageBlock
    /// </summary>
    private static byte[] GetDecodedData(ImageBlock imgBlock)
    {
        // Combine LZW compressed data
        List<byte> lzwData = new List<byte>();
        for (int i = 0; i < imgBlock.m_imageDataList.Count; i++)
        {
            for (int k = 0; k < imgBlock.m_imageDataList[i].m_imageData.Length; k++)
            {
                lzwData.Add(imgBlock.m_imageDataList[i].m_imageData[k]);
            }
        }

        // LZW decode
        int needDataSize = imgBlock.m_imageHeight * imgBlock.m_imageWidth;
        byte[] decodedData = DecodeGifLZW(lzwData, imgBlock.m_lzwMinimumCodeSize, needDataSize);

        // Sort interlace GIF
        if (imgBlock.m_interlaceFlag)
        {
            decodedData = SortInterlaceGifData(decodedData, imgBlock.m_imageWidth);
        }
        return decodedData;
    }

    /// <summary>
    /// Get color table and set background color (local or global)
    /// </summary>
    private static List<byte[]> GetColorTableAndSetBgColor(GifData gifData, ImageBlock imgBlock, int transparentIndex, out Color32 bgColor)
    {
        List<byte[]> colorTable = imgBlock.m_localColorTableFlag ? imgBlock.m_localColorTable : gifData.m_globalColorTableFlag ? gifData.m_globalColorTable : null;

        if (colorTable != null)
        {
            // Set background color from color table
            byte[] bgRgb = colorTable[gifData.m_bgColorIndex];
            bgColor = new Color32(bgRgb[0], bgRgb[1], bgRgb[2], (byte)(transparentIndex == gifData.m_bgColorIndex ? 0 : 255));
        }
        else
        {
            bgColor = Color.black;
        }

        return colorTable;
    }

    /// <summary>
    /// Get GraphicControlExtension from GifData
    /// </summary>
    private static GraphicControlExtension? GetGraphicCtrlExt(GifData gifData, int imgBlockIndex)
    {
        if (gifData.m_graphicCtrlExList != null && gifData.m_graphicCtrlExList.Count > imgBlockIndex)
        {
            return gifData.m_graphicCtrlExList[imgBlockIndex];
        }
        return null;
    }

    /// <summary>
    /// Get transparent color index from GraphicControlExtension
    /// </summary>
    private static int GetTransparentIndex(GraphicControlExtension? graphicCtrlEx)
    {
        int transparentIndex = -1;
        if (graphicCtrlEx != null && graphicCtrlEx.Value.m_transparentColorFlag)
        {
            transparentIndex = graphicCtrlEx.Value.m_transparentColorIndex;
        }
        return transparentIndex;
    }

    /// <summary>
    /// Get delay seconds from GraphicControlExtension
    /// </summary>
    private static float GetDelaySec(GraphicControlExtension? graphicCtrlEx)
    {
        // Get delay sec from GraphicControlExtension
        float delaySec = graphicCtrlEx != null ? graphicCtrlEx.Value.m_delayTime / 100f : (1f / 60f);
        if (delaySec <= 0f)
        {
            delaySec = 0.1f;
        }
        return delaySec;
    }

    /// <summary>
    /// Get disposal method from GraphicControlExtension
    /// </summary>
    private static ushort GetDisposalMethod(GraphicControlExtension? graphicCtrlEx)
    {
        return graphicCtrlEx != null ? graphicCtrlEx.Value.m_disposalMethod : (ushort)2;
    }

    /// <summary>
    /// Create Texture2D object and initial settings
    /// </summary>
    private static Texture2D CreateTexture2D(GifData gifData, List<GifTexture> gifTexList, int imgIndex, List<ushort> disposalMethodList, Color32 bgColor, FilterMode filterMode, TextureWrapMode wrapMode, out bool filledTexture)
    {
        filledTexture = false;

        // Create texture
        Texture2D tex = new Texture2D(gifData.m_logicalScreenWidth, gifData.m_logicalScreenHeight, TextureFormat.ARGB32, false);
        tex.filterMode = filterMode;
        tex.wrapMode = wrapMode;

        // Check dispose
        ushort disposalMethod = imgIndex > 0 ? disposalMethodList[imgIndex - 1] : (ushort)2;
        int useBeforeIndex = -1;
        if (disposalMethod == 0)
        {
            // 0 (No disposal specified)
        }
        else if (disposalMethod == 1)
        {
            // 1 (Do not dispose)
            useBeforeIndex = imgIndex - 1;
        }
        else if (disposalMethod == 2)
        {
            // 2 (Restore to background color)
            filledTexture = true;
            Color32[] pix = new Color32[tex.width * tex.height];
            for (int i = 0; i < pix.Length; i++)
            {
                pix[i] = bgColor;
            }
            tex.SetPixels32(pix);
            tex.Apply();
        }
        else if (disposalMethod == 3)
        {
            // 3 (Restore to previous)
            for (int i = imgIndex - 1; i >= 0; i--)
            {
                if (disposalMethodList[i] == 0 || disposalMethodList[i] == 1)
                {
                    useBeforeIndex = i;
                    break;
                }
            }
        }

        if (useBeforeIndex >= 0)
        {
            filledTexture = true;
            Color32[] pix = gifTexList[useBeforeIndex].m_texture2d.GetPixels32();
            tex.SetPixels32(pix);
            tex.Apply();
        }

        return tex;
    }

    /// <summary>
    /// Set texture pixel row
    /// </summary>
    private static void SetTexturePixelRow(Texture2D tex, int y, ImageBlock imgBlock, byte[] decodedData, ref int dataIndex, List<byte[]> colorTable, Color32 bgColor, int transparentIndex, bool filledTexture)
    {
        // Row no (0~)
        int row = tex.height - 1 - y;

        for (int x = 0; x < tex.width; x++)
        {
            // Line no (0~)
            int line = x;

            // Out of image blocks
            if (row < imgBlock.m_imageTopPosition ||
                row >= imgBlock.m_imageTopPosition + imgBlock.m_imageHeight ||
                line < imgBlock.m_imageLeftPosition ||
                line >= imgBlock.m_imageLeftPosition + imgBlock.m_imageWidth)
            {
                // Get pixel color from bg color
                if (filledTexture == false)
                {
                    tex.SetPixel(x, y, bgColor);
                }
                continue;
            }

            // Out of decoded data
            if (dataIndex >= decodedData.Length)
            {
                if (filledTexture == false)
                {
                    tex.SetPixel(x, y, bgColor);
                    if (dataIndex == decodedData.Length)
                    {
                        Debug.LogError("dataIndex exceeded the size of decodedData. dataIndex:" + dataIndex + " decodedData.Length:" + decodedData.Length + " y:" + y + " x:" + x);
                    }
                }
                dataIndex++;
                continue;
            }

            // Get pixel color from color table
            {
                byte colorIndex = decodedData[dataIndex];
                if (colorTable == null || colorTable.Count <= colorIndex)
                {
                    if (filledTexture == false)
                    {
                        tex.SetPixel(x, y, bgColor);
                        if (colorTable == null)
                        {
                            Debug.LogError("colorIndex exceeded the size of colorTable. colorTable is null. colorIndex:" + colorIndex);
                        }
                        else
                        {
                            Debug.LogError("colorIndex exceeded the size of colorTable. colorTable.Count:" + colorTable.Count + " colorIndex:" + colorIndex);
                        }
                    }
                    dataIndex++;
                    continue;
                }
                byte[] rgb = colorTable[colorIndex];

                // Set alpha
                byte alpha = transparentIndex >= 0 && transparentIndex == colorIndex ? (byte)0 : (byte)255;

                if (filledTexture == false || alpha != 0)
                {
                    // Set color
                    Color32 col = new Color32(rgb[0], rgb[1], rgb[2], alpha);
                    tex.SetPixel(x, y, col);
                }
            }

            dataIndex++;
        }
    }

    #endregion

    #region Decode LZW & Sort interrace methods

    /// <summary>
    /// GIF LZW decode
    /// </summary>
    /// <param name="compData">LZW compressed data</param>
    /// <param name="lzwMinimumCodeSize">LZW minimum code size</param>
    /// <param name="needDataSize">Need decoded data size</param>
    /// <returns>Decoded data array</returns>
    private static byte[] DecodeGifLZW(List<byte> compData, int lzwMinimumCodeSize, int needDataSize)
    {
        int clearCode = 0;
        int finishCode = 0;

        // Initialize dictionary
        Dictionary<int, string> dic = new Dictionary<int, string>();
        int lzwCodeSize = 0;
        InitDictionary(dic, lzwMinimumCodeSize, out lzwCodeSize, out clearCode, out finishCode);

        // Convert to bit array
        byte[] compDataArr = compData.ToArray();
        var bitData = new BitArray(compDataArr);

        byte[] output = new byte[needDataSize];
        int outputAddIndex = 0;

        string prevEntry = null;

        bool dicInitFlag = false;

        int bitDataIndex = 0;

        // LZW decode loop
        while (bitDataIndex < bitData.Length)
        {
            if (dicInitFlag)
            {
                InitDictionary(dic, lzwMinimumCodeSize, out lzwCodeSize, out clearCode, out finishCode);
                dicInitFlag = false;
            }

            int key = bitData.GetNumeral(bitDataIndex, lzwCodeSize);

            string entry = null;

            if (key == clearCode)
            {
                // Clear (Initialize dictionary)
                dicInitFlag = true;
                bitDataIndex += lzwCodeSize;
                prevEntry = null;
                continue;
            }
            else if (key == finishCode)
            {
                // Exit
                Debug.LogWarning("early stop code. bitDataIndex:" + bitDataIndex + " lzwCodeSize:" + lzwCodeSize + " key:" + key + " dic.Count:" + dic.Count);
                break;
            }
            else if (dic.ContainsKey(key))
            {
                // Output from dictionary
                entry = dic[key];
            }
            else if (key >= dic.Count)
            {
                if (prevEntry != null)
                {
                    // Output from estimation
                    entry = prevEntry + prevEntry[0];
                }
                else
                {
                    Debug.LogWarning("It is strange that come here. bitDataIndex:" + bitDataIndex + " lzwCodeSize:" + lzwCodeSize + " key:" + key + " dic.Count:" + dic.Count);
                    bitDataIndex += lzwCodeSize;
                    continue;
                }
            }
            else
            {
                Debug.LogWarning("It is strange that come here. bitDataIndex:" + bitDataIndex + " lzwCodeSize:" + lzwCodeSize + " key:" + key + " dic.Count:" + dic.Count);
                bitDataIndex += lzwCodeSize;
                continue;
            }

            // Output
            // Take out 8 bits from the string.
            byte[] temp = Encoding.Unicode.GetBytes(entry);
            for (int i = 0; i < temp.Length; i++)
            {
                if (i % 2 == 0)
                {
                    output[outputAddIndex] = temp[i];
                    outputAddIndex++;
                }
            }

            if (outputAddIndex >= needDataSize)
            {
                // Exit
                break;
            }

            if (prevEntry != null)
            {
                // Add to dictionary
                dic.Add(dic.Count, prevEntry + entry[0]);
            }

            prevEntry = entry;

            bitDataIndex += lzwCodeSize;

            if (lzwCodeSize == 3 && dic.Count >= 8)
            {
                lzwCodeSize = 4;
            }
            else if (lzwCodeSize == 4 && dic.Count >= 16)
            {
                lzwCodeSize = 5;
            }
            else if (lzwCodeSize == 5 && dic.Count >= 32)
            {
                lzwCodeSize = 6;
            }
            else if (lzwCodeSize == 6 && dic.Count >= 64)
            {
                lzwCodeSize = 7;
            }
            else if (lzwCodeSize == 7 && dic.Count >= 128)
            {
                lzwCodeSize = 8;
            }
            else if (lzwCodeSize == 8 && dic.Count >= 256)
            {
                lzwCodeSize = 9;
            }
            else if (lzwCodeSize == 9 && dic.Count >= 512)
            {
                lzwCodeSize = 10;
            }
            else if (lzwCodeSize == 10 && dic.Count >= 1024)
            {
                lzwCodeSize = 11;
            }
            else if (lzwCodeSize == 11 && dic.Count >= 2048)
            {
                lzwCodeSize = 12;
            }
            else if (lzwCodeSize == 12 && dic.Count >= 4096)
            {
                int nextKey = bitData.GetNumeral(bitDataIndex, lzwCodeSize);
                if (nextKey != clearCode)
                {
                    dicInitFlag = true;
                }
            }
        }

        return output;
    }

    /// <summary>
    /// Initialize dictionary
    /// </summary>
    /// <param name="dic">Dictionary</param>
    /// <param name="lzwMinimumCodeSize">LZW minimum code size</param>
    /// <param name="lzwCodeSize">out LZW code size</param>
    /// <param name="clearCode">out Clear code</param>
    /// <param name="finishCode">out Finish code</param>
    private static void InitDictionary(Dictionary<int, string> dic, int lzwMinimumCodeSize, out int lzwCodeSize, out int clearCode, out int finishCode)
    {
        int dicLength = (int)Math.Pow(2, lzwMinimumCodeSize);

        clearCode = dicLength;
        finishCode = clearCode + 1;

        dic.Clear();

        for (int i = 0; i < dicLength + 2; i++)
        {
            dic.Add(i, ((char)i).ToString());
        }

        lzwCodeSize = lzwMinimumCodeSize + 1;
    }

    /// <summary>
    /// Sort interlace GIF data
    /// </summary>
    /// <param name="decodedData">Decoded GIF data</param>
    /// <param name="xNum">Pixel number of horizontal row</param>
    /// <returns>Sorted data</returns>
    private static byte[] SortInterlaceGifData(byte[] decodedData, int xNum)
    {
        int rowNo = 0;
        int dataIndex = 0;
        var newArr = new byte[decodedData.Length];
        // Every 8th. row, starting with row 0.
        for (int i = 0; i < newArr.Length; i++)
        {
            if (rowNo % 8 == 0)
            {
                newArr[i] = decodedData[dataIndex];
                dataIndex++;
            }
            if (i != 0 && i % xNum == 0)
            {
                rowNo++;
            }
        }
        rowNo = 0;
        // Every 8th. row, starting with row 4.
        for (int i = 0; i < newArr.Length; i++)
        {
            if (rowNo % 8 == 4)
            {
                newArr[i] = decodedData[dataIndex];
                dataIndex++;
            }
            if (i != 0 && i % xNum == 0)
            {
                rowNo++;
            }
        }
        rowNo = 0;
        // Every 4th. row, starting with row 2.
        for (int i = 0; i < newArr.Length; i++)
        {
            if (rowNo % 4 == 2)
            {
                newArr[i] = decodedData[dataIndex];
                dataIndex++;
            }
            if (i != 0 && i % xNum == 0)
            {
                rowNo++;
            }
        }
        rowNo = 0;
        // Every 2nd. row, starting with row 1.
        for (int i = 0; i < newArr.Length; i++)
        {
            if (rowNo % 8 != 0 && rowNo % 8 != 4 && rowNo % 4 != 2)
            {
                newArr[i] = decodedData[dataIndex];
                dataIndex++;
            }
            if (i != 0 && i % xNum == 0)
            {
                rowNo++;
            }
        }

        return newArr;
    }

    #endregion


    /// <summary>
    /// Convert BitArray to int (Specifies the start index and bit length)
    /// </summary>
    /// <param name="startIndex">Start index</param>
    /// <param name="bitLength">Bit length</param>
    /// <returns>Converted int</returns>
    public static int GetNumeral(this BitArray array, int startIndex, int bitLength)
    {
        var newArray = new BitArray(bitLength);

        for (int i = 0; i < bitLength; i++)
        {
            if (array.Length <= startIndex + i)
            {
                newArray[i] = false;
            }
            else
            {
                bool bit = array.Get(startIndex + i);
                newArray[i] = bit;
            }
        }

        return newArray.ToNumeral();
    }

    /// <summary>
    /// Convert BitArray to int
    /// </summary>
    /// <returns>Converted int</returns>
    public static int ToNumeral(this BitArray array)
    {
        if (array == null)
        {
            Debug.LogError("array is nothing.");
            return 0;
        }
        if (array.Length > 32)
        {
            Debug.LogError("must be at most 32 bits long.");
            return 0;
        }

        var result = new int[1];
        array.CopyTo(result, 0);
        return result[0];
    }

    /// <summary>
    /// Set GIF data
    /// </summary>
    /// <param name="gifBytes">GIF byte data</param>
    /// <param name="gifData">ref GIF data</param>
    /// <param name="debugLog">Debug log flag</param>
    /// <returns>Result</returns>
    private static bool SetGifData(byte[] gifBytes, ref GifData gifData, bool debugLog)
    {
        if (debugLog)
        {
            Debug.Log("SetGifData Start.");
        }

        if (gifBytes == null || gifBytes.Length <= 0)
        {
            Debug.LogError("bytes is nothing.");
            return false;
        }

        int byteIndex = 0;

        if (SetGifHeader(gifBytes, ref byteIndex, ref gifData) == false)
        {
            Debug.LogError("GIF header set error.");
            return false;
        }

        if (SetGifBlock(gifBytes, ref byteIndex, ref gifData) == false)
        {
            Debug.LogError("GIF block set error.");
            return false;
        }

        if (debugLog)
        {
            gifData.Dump();
            Debug.Log("SetGifData Finish.");
        }
        return true;
    }

    private static bool SetGifHeader(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        // Signature(3 Bytes)
        // 0x47 0x49 0x46 (GIF)
        if (gifBytes[0] != 'G' || gifBytes[1] != 'I' || gifBytes[2] != 'F')
        {
            Debug.LogError("This is not GIF image.");
            return false;
        }
        gifData.m_sig0 = gifBytes[0];
        gifData.m_sig1 = gifBytes[1];
        gifData.m_sig2 = gifBytes[2];

        // Version(3 Bytes)
        // 0x38 0x37 0x61 (87a) or 0x38 0x39 0x61 (89a)
        if ((gifBytes[3] != '8' || gifBytes[4] != '7' || gifBytes[5] != 'a') &&
            (gifBytes[3] != '8' || gifBytes[4] != '9' || gifBytes[5] != 'a'))
        {
            Debug.LogError("GIF version error.\nSupported only GIF87a or GIF89a.");
            return false;
        }
        gifData.m_ver0 = gifBytes[3];
        gifData.m_ver1 = gifBytes[4];
        gifData.m_ver2 = gifBytes[5];

        // Logical Screen Width(2 Bytes)
        gifData.m_logicalScreenWidth = BitConverter.ToUInt16(gifBytes, 6);

        // Logical Screen Height(2 Bytes)
        gifData.m_logicalScreenHeight = BitConverter.ToUInt16(gifBytes, 8);

        // 1 Byte
        {
            // Global Color Table Flag(1 Bit)
            gifData.m_globalColorTableFlag = (gifBytes[10] & 128) == 128; // 0b10000000

            // Color Resolution(3 Bits)
            switch (gifBytes[10] & 112)
            {
                case 112: // 0b01110000
                    gifData.m_colorResolution = 8;
                    break;
                case 96: // 0b01100000
                    gifData.m_colorResolution = 7;
                    break;
                case 80: // 0b01010000
                    gifData.m_colorResolution = 6;
                    break;
                case 64: // 0b01000000
                    gifData.m_colorResolution = 5;
                    break;
                case 48: // 0b00110000
                    gifData.m_colorResolution = 4;
                    break;
                case 32: // 0b00100000
                    gifData.m_colorResolution = 3;
                    break;
                case 16: // 0b00010000
                    gifData.m_colorResolution = 2;
                    break;
                default:
                    gifData.m_colorResolution = 1;
                    break;
            }

            // Sort Flag(1 Bit)
            gifData.m_sortFlag = (gifBytes[10] & 8) == 8; // 0b00001000

            // Size of Global Color Table(3 Bits)
            int val = (gifBytes[10] & 7) + 1;
            gifData.m_sizeOfGlobalColorTable = (int)Math.Pow(2, val);
        }

        // Background Color Index(1 Byte)
        gifData.m_bgColorIndex = gifBytes[11];

        // Pixel Aspect Ratio(1 Byte)
        gifData.m_pixelAspectRatio = gifBytes[12];

        byteIndex = 13;
        if (gifData.m_globalColorTableFlag)
        {
            // Global Color Table(0～255×3 Bytes)
            gifData.m_globalColorTable = new List<byte[]>();
            for (int i = byteIndex; i < byteIndex + (gifData.m_sizeOfGlobalColorTable * 3); i += 3)
            {
                gifData.m_globalColorTable.Add(new byte[] { gifBytes[i], gifBytes[i + 1], gifBytes[i + 2] });
            }
            byteIndex = byteIndex + (gifData.m_sizeOfGlobalColorTable * 3);
        }

        return true;
    }

    private static bool SetGifBlock(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        try
        {
            int lastIndex = 0;
            while (true)
            {
                int nowIndex = byteIndex;

                if (gifBytes[nowIndex] == 0x2c)
                {
                    // Image Block(0x2c)
                    SetImageBlock(gifBytes, ref byteIndex, ref gifData);

                }
                else if (gifBytes[nowIndex] == 0x21)
                {
                    // Extension
                    switch (gifBytes[nowIndex + 1])
                    {
                        case 0xf9:
                            // Graphic Control Extension(0x21 0xf9)
                            SetGraphicControlExtension(gifBytes, ref byteIndex, ref gifData);
                            break;
                        case 0xfe:
                            // Comment Extension(0x21 0xfe)
                            SetCommentExtension(gifBytes, ref byteIndex, ref gifData);
                            break;
                        case 0x01:
                            // Plain Text Extension(0x21 0x01)
                            SetPlainTextExtension(gifBytes, ref byteIndex, ref gifData);
                            break;
                        case 0xff:
                            // Application Extension(0x21 0xff)
                            SetApplicationExtension(gifBytes, ref byteIndex, ref gifData);
                            break;
                        default:
                            break;
                    }
                }
                else if (gifBytes[nowIndex] == 0x3b)
                {
                    // Trailer(1 Byte)
                    gifData.m_trailer = gifBytes[byteIndex];
                    byteIndex++;
                    break;
                }

                if (lastIndex == nowIndex)
                {
                    Debug.LogError("Infinite loop error.");
                    return false;
                }

                lastIndex = nowIndex;
            }
        }
        catch (Exception ex)
        {
            Debug.LogError(ex.Message);
            return false;
        }

        return true;
    }

    private static void SetImageBlock(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        ImageBlock ib = new ImageBlock();

        // Image Separator(1 Byte)
        // 0x2c
        ib.m_imageSeparator = gifBytes[byteIndex];
        byteIndex++;

        // Image Left Position(2 Bytes)
        ib.m_imageLeftPosition = BitConverter.ToUInt16(gifBytes, byteIndex);
        byteIndex += 2;

        // Image Top Position(2 Bytes)
        ib.m_imageTopPosition = BitConverter.ToUInt16(gifBytes, byteIndex);
        byteIndex += 2;

        // Image Width(2 Bytes)
        ib.m_imageWidth = BitConverter.ToUInt16(gifBytes, byteIndex);
        byteIndex += 2;

        // Image Height(2 Bytes)
        ib.m_imageHeight = BitConverter.ToUInt16(gifBytes, byteIndex);
        byteIndex += 2;

        // 1 Byte
        {
            // Local Color Table Flag(1 Bit)
            ib.m_localColorTableFlag = (gifBytes[byteIndex] & 128) == 128; // 0b10000000

            // Interlace Flag(1 Bit)
            ib.m_interlaceFlag = (gifBytes[byteIndex] & 64) == 64; // 0b01000000

            // Sort Flag(1 Bit)
            ib.m_sortFlag = (gifBytes[byteIndex] & 32) == 32; // 0b00100000

            // Reserved(2 Bits)
            // Unused

            // Size of Local Color Table(3 Bits)
            int val = (gifBytes[byteIndex] & 7) + 1;
            ib.m_sizeOfLocalColorTable = (int)Math.Pow(2, val);

            byteIndex++;
        }

        if (ib.m_localColorTableFlag)
        {
            // Local Color Table(0～255×3 Bytes)
            ib.m_localColorTable = new List<byte[]>();
            for (int i = byteIndex; i < byteIndex + (ib.m_sizeOfLocalColorTable * 3); i += 3)
            {
                ib.m_localColorTable.Add(new byte[] { gifBytes[i], gifBytes[i + 1], gifBytes[i + 2] });
            }
            byteIndex = byteIndex + (ib.m_sizeOfLocalColorTable * 3);
        }

        // LZW Minimum Code Size(1 Byte)
        ib.m_lzwMinimumCodeSize = gifBytes[byteIndex];
        byteIndex++;

        // Block Size & Image Data List
        while (true)
        {
            // Block Size(1 Byte)
            byte blockSize = gifBytes[byteIndex];
            byteIndex++;

            if (blockSize == 0x00)
            {
                // Block Terminator(1 Byte)
                break;
            }

            var imageDataBlock = new ImageBlock.ImageDataBlock();
            imageDataBlock.m_blockSize = blockSize;

            // Image Data(? Bytes)
            imageDataBlock.m_imageData = new byte[imageDataBlock.m_blockSize];
            for (int i = 0; i < imageDataBlock.m_imageData.Length; i++)
            {
                imageDataBlock.m_imageData[i] = gifBytes[byteIndex];
                byteIndex++;
            }

            if (ib.m_imageDataList == null)
            {
                ib.m_imageDataList = new List<ImageBlock.ImageDataBlock>();
            }
            ib.m_imageDataList.Add(imageDataBlock);
        }

        if (gifData.m_imageBlockList == null)
        {
            gifData.m_imageBlockList = new List<ImageBlock>();
        }
        gifData.m_imageBlockList.Add(ib);
    }

    private static void SetGraphicControlExtension(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        GraphicControlExtension gcEx = new GraphicControlExtension();

        // Extension Introducer(1 Byte)
        // 0x21
        gcEx.m_extensionIntroducer = gifBytes[byteIndex];
        byteIndex++;

        // Graphic Control Label(1 Byte)
        // 0xf9
        gcEx.m_graphicControlLabel = gifBytes[byteIndex];
        byteIndex++;

        // Block Size(1 Byte)
        // 0x04
        gcEx.m_blockSize = gifBytes[byteIndex];
        byteIndex++;

        // 1 Byte
        {
            // Reserved(3 Bits)
            // Unused

            // Disposal Mothod(3 Bits)
            // 0 (No disposal specified)
            // 1 (Do not dispose)
            // 2 (Restore to background color)
            // 3 (Restore to previous)
            switch (gifBytes[byteIndex] & 28)
            { // 0b00011100
                case 4:     // 0b00000100
                    gcEx.m_disposalMethod = 1;
                    break;
                case 8:     // 0b00001000
                    gcEx.m_disposalMethod = 2;
                    break;
                case 12:    // 0b00001100
                    gcEx.m_disposalMethod = 3;
                    break;
                default:
                    gcEx.m_disposalMethod = 0;
                    break;
            }

            // User Input Flag(1 Bit)
            // Unknown

            // Transparent Color Flag(1 Bit)
            gcEx.m_transparentColorFlag = (gifBytes[byteIndex] & 1) == 1; // 0b00000001

            byteIndex++;
        }

        // Delay Time(2 Bytes)
        gcEx.m_delayTime = BitConverter.ToUInt16(gifBytes, byteIndex);
        byteIndex += 2;

        // Transparent Color Index(1 Byte)
        gcEx.m_transparentColorIndex = gifBytes[byteIndex];
        byteIndex++;

        // Block Terminator(1 Byte)
        gcEx.m_blockTerminator = gifBytes[byteIndex];
        byteIndex++;

        if (gifData.m_graphicCtrlExList == null)
        {
            gifData.m_graphicCtrlExList = new List<GraphicControlExtension>();
        }
        gifData.m_graphicCtrlExList.Add(gcEx);
    }

    private static void SetCommentExtension(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        CommentExtension commentEx = new CommentExtension();

        // Extension Introducer(1 Byte)
        // 0x21
        commentEx.m_extensionIntroducer = gifBytes[byteIndex];
        byteIndex++;

        // Comment Label(1 Byte)
        // 0xfe
        commentEx.m_commentLabel = gifBytes[byteIndex];
        byteIndex++;

        // Block Size & Comment Data List
        while (true)
        {
            // Block Size(1 Byte)
            byte blockSize = gifBytes[byteIndex];
            byteIndex++;

            if (blockSize == 0x00)
            {
                // Block Terminator(1 Byte)
                break;
            }

            var commentDataBlock = new CommentExtension.CommentDataBlock();
            commentDataBlock.m_blockSize = blockSize;

            // Comment Data(n Byte)
            commentDataBlock.m_commentData = new byte[commentDataBlock.m_blockSize];
            for (int i = 0; i < commentDataBlock.m_commentData.Length; i++)
            {
                commentDataBlock.m_commentData[i] = gifBytes[byteIndex];
                byteIndex++;
            }

            if (commentEx.m_commentDataList == null)
            {
                commentEx.m_commentDataList = new List<CommentExtension.CommentDataBlock>();
            }
            commentEx.m_commentDataList.Add(commentDataBlock);
        }

        if (gifData.m_commentExList == null)
        {
            gifData.m_commentExList = new List<CommentExtension>();
        }
        gifData.m_commentExList.Add(commentEx);
    }

    private static void SetPlainTextExtension(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        PlainTextExtension plainTxtEx = new PlainTextExtension();

        // Extension Introducer(1 Byte)
        // 0x21
        plainTxtEx.m_extensionIntroducer = gifBytes[byteIndex];
        byteIndex++;

        // Plain Text Label(1 Byte)
        // 0x01
        plainTxtEx.m_plainTextLabel = gifBytes[byteIndex];
        byteIndex++;

        // Block Size(1 Byte)
        // 0x0c
        plainTxtEx.m_blockSize = gifBytes[byteIndex];
        byteIndex++;

        // Text Grid Left Position(2 Bytes)
        // Not supported
        byteIndex += 2;

        // Text Grid Top Position(2 Bytes)
        // Not supported
        byteIndex += 2;

        // Text Grid Width(2 Bytes)
        // Not supported
        byteIndex += 2;

        // Text Grid Height(2 Bytes)
        // Not supported
        byteIndex += 2;

        // Character Cell Width(1 Bytes)
        // Not supported
        byteIndex++;

        // Character Cell Height(1 Bytes)
        // Not supported
        byteIndex++;

        // Text Foreground Color Index(1 Bytes)
        // Not supported
        byteIndex++;

        // Text Background Color Index(1 Bytes)
        // Not supported
        byteIndex++;

        // Block Size & Plain Text Data List
        while (true)
        {
            // Block Size(1 Byte)
            byte blockSize = gifBytes[byteIndex];
            byteIndex++;

            if (blockSize == 0x00)
            {
                // Block Terminator(1 Byte)
                break;
            }

            var plainTextDataBlock = new PlainTextExtension.PlainTextDataBlock();
            plainTextDataBlock.m_blockSize = blockSize;

            // Plain Text Data(n Byte)
            plainTextDataBlock.m_plainTextData = new byte[plainTextDataBlock.m_blockSize];
            for (int i = 0; i < plainTextDataBlock.m_plainTextData.Length; i++)
            {
                plainTextDataBlock.m_plainTextData[i] = gifBytes[byteIndex];
                byteIndex++;
            }

            if (plainTxtEx.m_plainTextDataList == null)
            {
                plainTxtEx.m_plainTextDataList = new List<PlainTextExtension.PlainTextDataBlock>();
            }
            plainTxtEx.m_plainTextDataList.Add(plainTextDataBlock);
        }

        if (gifData.m_plainTextExList == null)
        {
            gifData.m_plainTextExList = new List<PlainTextExtension>();
        }
        gifData.m_plainTextExList.Add(plainTxtEx);
    }

    private static void SetApplicationExtension(byte[] gifBytes, ref int byteIndex, ref GifData gifData)
    {
        // Extension Introducer(1 Byte)
        // 0x21
        gifData.m_appEx.m_extensionIntroducer = gifBytes[byteIndex];
        byteIndex++;

        // Extension Label(1 Byte)
        // 0xff
        gifData.m_appEx.m_extensionLabel = gifBytes[byteIndex];
        byteIndex++;

        // Block Size(1 Byte)
        // 0x0b
        gifData.m_appEx.m_blockSize = gifBytes[byteIndex];
        byteIndex++;

        // Application Identifier(8 Bytes)
        gifData.m_appEx.m_appId1 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId2 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId3 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId4 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId5 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId6 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId7 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appId8 = gifBytes[byteIndex];
        byteIndex++;

        // Application Authentication Code(3 Bytes)
        gifData.m_appEx.m_appAuthCode1 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appAuthCode2 = gifBytes[byteIndex];
        byteIndex++;
        gifData.m_appEx.m_appAuthCode3 = gifBytes[byteIndex];
        byteIndex++;

        // Block Size & Application Data List
        while (true)
        {
            // Block Size (1 Byte)
            byte blockSize = gifBytes[byteIndex];
            byteIndex++;

            if (blockSize == 0x00)
            {
                // Block Terminator(1 Byte)
                break;
            }

            var appDataBlock = new ApplicationExtension.ApplicationDataBlock();
            appDataBlock.m_blockSize = blockSize;

            // Application Data(n Byte)
            appDataBlock.m_applicationData = new byte[appDataBlock.m_blockSize];
            for (int i = 0; i < appDataBlock.m_applicationData.Length; i++)
            {
                appDataBlock.m_applicationData[i] = gifBytes[byteIndex];
                byteIndex++;
            }

            if (gifData.m_appEx.m_appDataList == null)
            {
                gifData.m_appEx.m_appDataList = new List<ApplicationExtension.ApplicationDataBlock>();
            }
            gifData.m_appEx.m_appDataList.Add(appDataBlock);
        }
    }
}
```

> Source: **chi chi** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1361060462590165115)
