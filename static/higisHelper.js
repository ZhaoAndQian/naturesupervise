// 经纬度类
export const Point = (x,y)=>{
  let point = new Object()
  point.lng = x// 经度
  point.lat = y// 纬度
  return point
}
// 标记类
export const MarkIcon = (iconUrl = './static/images/qq.png', iconAnchor = [13, 40], popupAnchor = [3, -50]) => {
  let img = new L.icon({iconUrl, iconAnchor, popupAnchor})
  return img
}
// 弹窗类
export const Popup = (content, maxHeight, minWidth, y, x)=> {
  let popup = L.popup({maxHeight, minWidth})
  popup.setLatLng(new L.LatLng(y, x))
  popup.setContent(content)
  return popup
}
// 装载底图
export const showLayer= (layerID,map) => {
  var loadedLayers = {};
  if (loadedLayers['L' + layerID] === undefined) {
    switch (layerID) {
      case 999999:
        loadedLayers['L' + layerID] = new L.tileLayer("http://t1.tianditu.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles", { maxZoom: 20 });
        break;
      case 999998:
        loadedLayers['L' + layerID] = new L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20 });
        break;
      case 999997:
        loadedLayers['L' + layerID] = new L.tileLayer("http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 20 });
        break;
      default:
        loadedLayers['L' + layerID] = new L.tileLayer("http://www.higis.org.cn:8082/hiart/" + layerID + "/{z}/{x}/{y}.png", { maxZoom: 20 });
      }
  }
  if (map.hasLayer(loadedLayers['L' + layerID])) {
      map.removeLayer(loadedLayers['L' + layerID]);
  } else {
      map.addLayer(loadedLayers['L' + layerID]);
  }
}
// 切换位置
export const changeArea= (bound,map) => {
  map.fitBounds(new L.latLngBounds(bound))
}
// 添加标记
export const addMark =(map, img, y, x) => {
  let marker = new L.Marker(new L.LatLng(y, x), {icon: img})
  map.addLayer(marker)
  return marker
}

// 画线
export const addPolyline = (map, points) => {
  let _points = []
  points.forEach(item => {
    let point = [item.lat, item.lng]
    _points.push(point)
  })
  L.polyline(_points).addTo(map)
}

// 加载地图
export const loadMap= (vue,container,baseMap,currentMap,centerPoint) => {
  if(vue === undefined)
  {
    // $vue=vue
  }
  let map = L.higis(container, {
    higis: {
      // ulControlId: "myLayers"
    }
  }).setView([centerPoint.lat, centerPoint.lng], 13);
  showLayer(baseMap,map);// 加载底图
  showLayer(currentMap,map);
  // 开启比例尺
  L.control.scale({imperial: false}).addTo(map);
  // 显示坐标
  // map.on("mousemove", function (e) {
  //   var containerPoint = map.mouseEventToContainerPoint(e.originalEvent)
  //   var layerPoint = map.containerPointToLayerPoint(containerPoint)
  //   var point = map.layerPointToLatLng(layerPoint)
  //   var str = point.lng.toFixed(4) + "," + point.lat.toFixed(4)
  //   console.log('坐标：' + str)
  // });
  // 添加draw控件
  var drawItem = new L.FeatureGroup();
  var drawControl = new L.Control.Draw({
    draw: {
      polygon: {
        title: "Measure an area!",
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#b00b00',
            timeout: 1000
        },
        shapeOptions: {
          color: '#FFD700'
        }
      },
      polyline: {
        title: "Measure distance",
        allowIntersection: true,
        shapeOptions: {
          color: '#FFD700'
        }
      },
      circle: false,
      rectangle: true,
      marker: false
    },
    edit: {featureGroup: drawItem}
  });
  map.addLayer(drawItem);
  map.addControl(drawControl);
  var features = [];
  //为标绘对象添加click事件，显示距离，面积
  map.on("draw:created", function (e) {
      var areas = e.layer.getAreas();
      var distances = e.layer.getDistances();
      drawItem.addLayer(e.layer);
      features.push(e.layer);
      e.layer.addEventListener('click', function () {
          if (e.layerType === 'polyline' || e.layerType === 'fpolyline') {
            vue.$message(distances)
          }
          else if (e.layerType === 'polygon' || e.layerType === 'rectangle' || e.layerType === 'polygon') {
            vue.$message(areas)
          }
      });
  });
  return map;
}
export default{
  Point,
  loadMap,
  changeArea,
  MarkIcon,
  addMark,
  Popup,
  addPolyline
}