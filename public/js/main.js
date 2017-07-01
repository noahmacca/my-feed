// user-defined js injected in all footer files

function showShareLink(index) {
    var textElement = document.querySelectorAll("#share-link")[index] 
    textElement.style.display = "block" // todo: change this to toggling a show class
    textElement.select();
    document.execCommand('copy');
    document.querySelectorAll("#copied-message")[index].style.display = "inline-block";
    return
}