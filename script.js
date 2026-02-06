    const mapEl = document.getElementById("map");

    mapEl.addEventListener("arcgisViewReadyChange", () => {
    const view = mapEl.view;

    // 1) Start view on Coral Gables
    view.center = [-80.2684, 25.7215];
    view.zoom = 13;

    // 2) Buttons
    document.getElementById("btn-coral").onclick = () => {
      view.goTo({ center: [-80.2684, 25.7215], zoom: 13 });
    };
    document.getElementById("btn-zoom-in").onclick = () => view.zoom += 1;
    document.getElementById("btn-zoom-out").onclick = () => view.zoom -= 1;

    // 3) Load FeatureLayer and add your service URL
    require(
      ["esri/layers/FeatureLayer", "esri/geometry/geometryEngine", "esri/Graphic", "esri/layers/GraphicsLayer",
      "esri/widgets/Sketch"],
      (FeatureLayer, geometryEngine, Graphic, GraphicsLayer, Sketch) => {
        let bufferGraphic = null; 

        const drawLayer = new GraphicsLayer();     // circle/rectangle visuals
        const selectionLayer = new GraphicsLayer(); // selected points visuals
        view.map.addMany([drawLayer, selectionLayer]);

        const selectedCountEl = document.getElementById("selected-count");
        const selectedListEl = document.getElementById("selected-list");
        const selectedFilterEl = document.getElementById("selected-filter");
        const selectedSortEl = document.getElementById("selected-sort");

        const clearFiltersBtn = document.getElementById("btn-clear-filters");

        let selectedFeatures = [];

        const sketch = new Sketch({
          view: view,
          layer: drawLayer,
          creationMode: "single",
          availableCreateTools: ["rectangle", "polygon"]
        });

        view.ui.add(sketch, "top-right");

        sketch.on("create", async (e) => {
          if (e.state !== "complete") return;

          const geom = e.graphic.geometry;   // rectangle/polygon user drew
          await selectPointsInside(geom);    // reuse your function from feature #1
          });

        sketch.on("create", (e) => {
          if (e.state === "start") {
            drawLayer.removeAll(); 
            selectionLayer.removeAll();
          }
        });

        function clearAll() {
          drawLayer.removeAll();
          selectionLayer.removeAll();
          clearSelectedUI();
        }

        function getFilteredAndSorted(features) {
          const term = (selectedFilterEl.value || "").trim().toLowerCase();
          const sortMode = selectedSortEl.value || "none";

          let list = features.slice();

          // Filter
          if (term) {
            list = list.filter((f) => {
              const a = f.attributes || {};
              const addr = (a.TRUE_SITE_ADDR ?? "").toString().toLowerCase();
              const city = (a.TRUE_SITE_CITY ?? "").toString().toLowerCase();
              return addr.includes(term) || city.includes(term);
            });
          }

          if (sortMode === "az" || sortMode === "za") {
            list.sort((fa, fb) => {
              const a1 = fa.attributes || {};
              const a2 = fb.attributes || {};

              const addrA = `${a1.TRUE_SITE_ADDR ?? ""} ${a1.TRUE_SITE_CITY ?? ""}`.trim().toLowerCase();
              const addrB = `${a2.TRUE_SITE_ADDR ?? ""} ${a2.TRUE_SITE_CITY ?? ""}`.trim().toLowerCase();

            return addrA.localeCompare(addrB);
          });

          if (sortMode === "za") list.reverse();
          }

          return list;
        }

        function renderSelectedList(features) {
          const display = getFilteredAndSorted(features);

          selectedCountEl.textContent = `Selected: ${display.length} (of ${features.length})`;
          selectedListEl.innerHTML = "";

          if (!display.length) {
            selectedListEl.innerHTML = `<div class="selected-item" style="cursor:default;opacity:.6;">No matches</div>`;
            return;
          }

          display.forEach((f) => {
            const a = f.attributes || {};
            const addr = a.TRUE_SITE_ADDR ?? "Unknown address";
            const city = a.TRUE_SITE_CITY ?? "";

            const row = document.createElement("div");
            row.className = "selected-item";
            row.textContent = city ? `${addr} — ${city}` : addr;

            row.onclick = async () => {
              await view.goTo({ center: f.geometry, zoom: Math.max(view.zoom, 16) });

              view.popup.open({
                title: addr,
                location: f.geometry
              });
            };

            selectedListEl.appendChild(row);
          });
        }

        function resetFilters() {
          selectedFilterEl.value = "";
          selectedSortEl.value = "none";
          renderSelectedList(selectedFeatures);
        }

        function clearSelectedUI() {
          selectedFeatures = [];
          selectedCountEl.textContent = "Selected: 0";

          selectedFilterEl.value = "";
          selectedSortEl.value = "none";

          selectedListEl.innerHTML = `<div class="selected-item" style="cursor:default;opacity:.6;">No selected points</div>`;
        }

        clearFiltersBtn.onclick = resetFilters;

        selectedFilterEl.addEventListener("input", () => renderSelectedList(selectedFeatures));
        selectedSortEl.addEventListener("change", () => renderSelectedList(selectedFeatures));

        clearSelectedUI();
        resetFilters();

        async function selectPointsInside(geometry) {
          const q = addressLayer.createQuery();
          q.geometry = geometry;
          q.spatialRelationship = "intersects";
          q.returnGeometry = true;
          q.outFields = ["*"];

          const res = await addressLayer.queryFeatures(q);

          selectedFeatures = res.features;
          renderSelectedList(selectedFeatures);

          selectionLayer.removeAll();

          res.features.forEach((f) => {
            selectionLayer.add(new Graphic({
              geometry: f.geometry,
              symbol: {
                type: "simple-marker",
                size: 6,
                color: [255, 0, 0, 0.9],
                outline: { color: [255, 255, 255, 1], width: 1 }
              }
            }));
          });
        } 

        document.getElementById("btn-clear").onclick = clearAll;


      const addressLayer = new FeatureLayer({
        url: "https://gisent.coralgables.com/entserver/rest/services/DisplayMap_MIL1/MapServer/1",
        outFields: ["*"],
        popupEnabled: false
      });

      // 4) Make points look nicer (professional)
      addressLayer.renderer = {
        type: "simple",
        symbol: {
          type: "simple-marker",
          size: 4,
          color: "#1976d2",
          outline: { color: "white", width: 0.5 }
        }
      };

      view.map.add(addressLayer);

      // 5) Click a point → show a clean popup
      view.on("click", async (event) => {

        // Hold SHIFT to identify a point (no radius selection)
        if (event.native?.shiftKey) {
          const hit = await view.hitTest(event);
          const result = hit.results.find(r => r.graphic?.layer === addressLayer);
          if (!result) return;

          const attrs = result.graphic.attributes;

          const addr = attrs.TRUE_SITE_ADDR ?? "Unknown address";
          const city = attrs.TRUE_SITE_CITY ?? "";
          const unitLabel = attrs.TRUE_SITE_UNIT ? `Unit ${attrs.TRUE_SITE_UNIT}` : "";
          const pid = attrs.PID ?? "";
          const folio = attrs.FOLIO ?? "";

          view.popup.open({
            title: addr,
            location: result.graphic.geometry,
            content: `
            <div style="font-size:14px; line-height:1.4;">
            <div><b>City:</b> ${city}</div>
            ${unitLabel ? `<div><b>${unitLabel}</b></div>` : ""}
            ${pid ? `<div><b>PID:</b> ${pid}</div>` : ""}
            ${folio ? `<div><b>FOLIO:</b> ${folio}</div>` : ""}
            </div>
            `    
          });

          return; // important: stop here, don't run radius selection
        }


        // Every click = new radius selection
        drawLayer.removeAll();
        selectionLayer.removeAll();
        clearSelectedUI();

        const r = Number(document.getElementById("radius").value) || 1000;
        const radiusUnit = document.getElementById("radiusUnit").value || "feet";

        const circle = geometryEngine.buffer(event.mapPoint, r, radiusUnit);

        drawLayer.add(new Graphic({
          geometry: circle,
          symbol: {
            type: "simple-fill",
            color: [25, 118, 210, 0.15],
            outline: { color: [25, 118, 210, 0.9], width: 2 }
          }
        }));

        await selectPointsInside(circle);
        await view.goTo(circle.extent.expand(1.3));

        return; // stop popup logic

        const hit = await view.hitTest(event);
        const result = hit.results.find(r => r.graphic?.layer === addressLayer);
        if (!result) return;

        const attrs = result.graphic.attributes;

        const addr = attrs.TRUE_SITE_ADDR ?? "Unknown address";
        const city = attrs.TRUE_SITE_CITY ?? "";
        const unit = attrs.TRUE_SITE_UNIT ? `Unit ${attrs.TRUE_SITE_UNIT}` : "";
        const pid = attrs.PID ?? "";
        const folio = attrs.FOLIO ?? "";

        view.popup.open({
          title: addr,
          location: result.graphic.geometry,
          content: `
          <div style="font-size:14px; line-height:1.4;">
          <div><b>City:</b> ${city}</div>
          ${unit ? `<div><b>${unit}</b></div>` : ""}
          ${pid ? `<div><b>PID:</b> ${pid}</div>` : ""}
          ${folio ? `<div><b>FOLIO:</b> ${folio}</div>` : ""}
          </div>
          `
        });
      });
    });
  });