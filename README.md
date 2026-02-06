# GIS Coral Gables Web Map

🔗 **Live Demo:**  
https://yelyzaveta-lukina.github.io/GIS-Coral-Gables/

## Overview
This project is an interactive GIS web application built using the **ArcGIS Maps SDK for JavaScript**. The app allows users to explore address locations in Coral Gables, select nearby addresses within a configurable radius, and interact with the results through filtering, sorting, and map-based inspection.

The project demonstrates core web GIS concepts including spatial queries, client-side filtering, and user-friendly map interaction.

## Features
- 🗺️ Interactive web map centered on Coral Gables
- 📍 Click anywhere on the map to select addresses within a chosen radius
- 🔴 Selected addresses are highlighted on the map
- 📋 Dynamic list of selected addresses in the sidebar
- 🔎 Filter selected addresses by street name or city
- 🔠 Sort results (numeric address order A→Z / Z→A)
- 🧹 Clear selection and filters easily
- 🖱️ **Shift + Click** on a point to inspect address details without creating a new radius
- 🎨 Clean, responsive UI layout

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6)
- ArcGIS Maps SDK for JavaScript
- GitHub Pages (for hosting)

## How It Works
1. The user clicks on the map to create a circular selection area.
2. Address points within the radius are queried from a FeatureLayer service.
3. Selected points are highlighted and listed in the sidebar.
4. Users can filter and sort the selected results in real time.
5. Holding **Shift** while clicking a point displays detailed information about that address.

## Data Source
Address data is provided via an ArcGIS REST Feature Service published by the City of Coral Gables.

## Project Status
This project is a learning-focused web GIS application and may be expanded with additional tools such as:
- Basemap switching
- Exporting selected results
- Additional sorting and analytics options

## Author
**Yelyzaveta Lukina**

---
