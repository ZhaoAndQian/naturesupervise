function allowDrag(elementId){
  var Drag = document.getElementById(elementId)
  Drag.onmousedown = function(event) {
    var ev = event || window.event
    event.stopPropagation()
    var disX = ev.clientX - Drag.offsetLeft
    var disY = ev.clientY - Drag.offsetTop
    document.onmousemove = function(event) {
      var ev = event || window.event
      Drag.style.left = ev.clientX - disX + "px"
      Drag.style.top = ev.clientY - disY + "px"
    }
    Drag.onmouseup = function() {
        document.onmousemove = null
    }
  }
}

export default {
  allowDrag
}
