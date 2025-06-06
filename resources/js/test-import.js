// Test import to verify AlbumRest loads correctly
import AlbumRest from "./Actions/AlbumRest";

console.log("AlbumRest imported successfully:", AlbumRest);

// Test the checkAuth method
AlbumRest.checkAuth().then(result => {
    console.log("checkAuth result:", result);
}).catch(error => {
    console.error("checkAuth error:", error);
});
