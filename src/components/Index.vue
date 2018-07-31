<template>
  <div>
    <div id="map" style="float: left;width: 100%;height: 100%;position: absolute">
    </div>
    <div id="uu" v-bind:class="toolClass" @mouseover="menuMouseOver" @mouseout="menuMouseOut">
      <el-dropdown>
        <el-button>
          地图菜单<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item>黄金糕糕糕</el-dropdown-item>
          <el-dropdown-item>狮子头头头</el-dropdown-item>
          <el-dropdown-item>螺蛳粉粉粉</el-dropdown-item>
          <el-dropdown-item>双皮奶奶奶</el-dropdown-item>
          <el-dropdown-item>蚵仔煎渐渐</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import map from '../../static/higisHelper.js'
import common from '../../static/common.js'
let _this
export default {
  mounted: function () {
    _this = this
    common.allowDrag('uu')
    _this.currentMap = map.loadMap(_this, 'map', 999999, 5450, map.Point(110.8720, 28.3679))
  },
  name: 'Index',
  data () {
    return {
      currentMap: undefined,
      toolClass: 'out'
    }
  },
  methods: {
    load () {
      _this.currentMap = map.loadMap(_this, 'map', 999999, 5450, map.Point(110.8720, 28.3679))
    },
    menuMouseOver () {
      _this.toolClass = 'hover'
    },
    menuMouseOut () {
      _this.toolClass = 'out'
    },
    cutArea (item) {
      let bound = [[item.minY, item.minX], [item.maxY, item.maxX]]
      map.changeArea(bound, _this.currentMap)
    },
    addMark (item) {
      let icon = map.MarkIcon()
      let marker = map.addMark(_this.currentMap, icon, 29.3044, 112.9449)
      marker.addEventListener('click', function () {
        let popup = map.Popup('<span>我是一个higis的弹窗.......................<br><br></span>', 100, 150, 29.4044, 112.9449)
        popup.addTo(_this.currentMap)
      })
    },
    addPolyline () {
      var points = [
        map.Point(104.06387329101562, 30.66331280120874),
        map.Point(106.54678344726562, 29.569873858372727), // 重庆
        map.Point(112.93121337890625, 28.234229675051058), // 长沙
        map.Point(114.30038452148439, 30.600093873550072), // 武汉
        map.Point(115.85494995117189, 28.688178255991442), // 南昌
        map.Point(117.22274780273439, 31.828565514766165), // 合肥
        map.Point(120.15335083007814, 30.274486436999464), // 杭州
        map.Point(118.78692626953126, 32.06511939104017), // 南京
        map.Point(121.46484375000001, 31.240985378021307)]
      map.addPolyline(_this.currentMap, points)
    }
  }
}
</script>
<style>
.hover {
  position: absolute;
  top: 10px;
  left: 200px;
  opacity: 1;
  border-radius: 5px;
  z-index: 1;
}
.out {
  position: absolute;
  top: 10px;
  left: 200px;
  opacity: 0.3;
  z-index: 1;
  border-radius: 5px;
}
</style>
