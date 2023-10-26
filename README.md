# [Griddle My Pictures](https://griddlemypictures.com/)
###### aka photo book creator 
---

## Purpose
Every year I make a year-in-review photobook as a gift for family. This has been a labor intensive process involving winnowing down a years worth of pictures, selecting an online service for creating layouts, uploading all of the images to that service, and creating the layouts. I wanted to streamline this process (and learn more about web programming). 

## Goals
- Entirely browser based.  No uploads, no server.
- Output full-page images suitable for photo-book printing.
- Use a rating system to ensure must-have images make it into the final product.
- Use face/animal detection to arrange/center photos.


## Quick Start
1. Collect your images in a single, flat, local directory.
2. Load the images
    - Click 'Load Images'
    - Select all of the local image files.
    - Wait for the images to load.  The face detection is run on the images during this initial load.
    - A rating is auto-assigned to each image based on the number of subjects detected and how prominent they are in the image
3. Select a page layout from the strip at the bottom of the page.
    - shift+click to add more pages
4. Click 'Fill All' under the Book heading.
    - This attempts a smart fill of all empty pages
    - The largest cells are filled with the highest ranking images that have a similar aspect ratio.
    - The detected faces or animals in the image are used to center the image inside of the cell.
5. Review the generated pages
    -  Make manual tweaks to image placement
    -  Use the 'Unfilled' button in the page selection row to navigate to unfilled cells
    -  Adjust the Aspect Tolerance slider under the Book heading and re-click Fill All.
6. Export the full-page images
    - Use the buttons under the Download heading
    - Page downloads the current page.
    - All downloads all pages as a zip file.
7. Optionally export the layout as JSON
8. Click 'Clear All Data' to wipe everything **Can't be Undone**
---
## Image Placement
Adding an image to the page.
- Click an image in the photo pool at the top of the page to select it.
- The selected image appears enlarged next to the current page.
- Clicking a cell on the page will place the selected image in that cell, and will replace any existing image.
- Double click an image on the page to remove it.

## Image Adjustment
Adjusting an image on the page
- **Make sure no image is selected or you will replace the image when you click.**
- Click and drag the image to move it within the cell 
- Shift+mouseWheel to zoom
- Shift+click to recenter the faces.
- 
## Undo/Redo
- Use the buttons or ctrl+z/ ctrl+y
- The undo stack is not exported to JSON, nor is it preserved during a page refresh.
- If the stack is large, performance may degrade.  Refresh the page to clear it.

## Ratings
- If faces or animals are detected in the image, a rating will be auto assigned.
- The selected image may be rated by pressing a number key.
- Use the Photo Filter dropdowns to filter the photo pool by a given rating.
- Photos without an auto-rating are rated 0 by default.  
    - Quickly manually rate these by selected 0 from the ByRating dropdown and then pressing a number key for each image

---
## Other controls
##### Load Images
Loads the image into the browser and processes it with the face detection. The image itself is persisted in the browser storage (Indexed DB) untill all data is purged with 'Clear All Data'

##### Download
Exports the page(s) as an image(s).

##### Undo/Redo
**'Clear All Data' cannot be undone.**

##### Page
- Clear -- Remove all images from the current page
- Delete -- Also remove the blank page

##### Book
- Fill All -- Place the highest rated images into the largest empty spaces, respecting their aspect ratios
- Aspect Tolerance slider -- Higher values allow a greater mismatch between the aspect ratios. A larger number places more images, but also crops them more.

##### JSON
This can be used to 'save' the state of a project to a text file and reload it later.  The images are not saved, just the current page layouts.  If an image hasn't been loaded when restoring from JSON, a message will note the name of the missing file.  The file can be loaded again with 'Load Images' to finish restoring the project.  The image is only ID'd by name, there is no source directory information; this is why I suggest collecting all of the images into one directory before using this tool.

##### Photo Filter
Filter the photo pool by Rating or Object.  This is usefull for rating any unrated images and to check for highly rated images that haven't made it onto a page yet.

##### Page Layout
This controls the dimensions and resolution of the generated images.  The defaults have worked well for me.  I would caution against using a largely different aspect ratio (e.g. a square) at this time, since the templates may not scale well.

##### Clear All Data
Deletes everything.  All Image data and page layout data is cleared. **This cannot be undone!!**
---
## Technical 
- Written in React
- All state (besides the image data) is stored in Redux
- Data is persisted in Indexed DB via [localforage](https://github.com/localForage/localForage)
- Face detection via [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- Object Classification via [web-ai](https://github.com/visheratin/web-ai)