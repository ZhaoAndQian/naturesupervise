<template>
  <div id="app">
    <!-- <child ref="child"></child> -->
    <div id="menu" v-bind:class="menuClass" @mouseover="menuMouseOver" @mouseout="menuMouseOut">
      <el-popover trigger="hover" placement="top-start">
        <div style="text-align: left; margin: 0">
          <hr>
          <el-row>
            <el-button round size="small" v-for="item in provinceData" :key="item" @click="getPlaceType(item)">{{item}}</el-button>
          </el-row>
          <hr>
          <el-row>
            <el-button round size="small" v-for="item in placeType" :key="item" @click="getProtectArea(item)">{{item}}</el-button>
          </el-row>
          <hr>
          <el-row>
            <el-button round size="small" v-for="item in protectArea" :key="item.id" @click="cutArea(item)">
            <router-link :to="{path: '/', query :{id: item}}">{{item.placeName}}</router-link>
            </el-button>
          </el-row>
          <hr v-if="protectArea.length > 0 && isSelected">
          <el-row v-if="protectArea.length > 0 && isSelected">
            <el-button round size="small" @click="aerialShoot('http://119.23.74.200')">无人机航拍</el-button>
            <el-button round size="small" v-for="item in areaMenu" :key="item.name">
              <router-link :to="item.path">{{item.name}}</router-link>
            </el-button>
          </el-row>
        </div>
        <el-button slot="reference">悬浮菜单</el-button>
      </el-popover>
    </div>
    <router-view/>
  </div>
</template>

<script>
import common from '../static/common.js'
import child from '../src/components/Index.vue'
let _this
export default {
  // watch: {
  //   '$route' (to, from) {
  //     // console.log(to.query.id)
  //     // child.data().currentArea = to.query.id
  //     child.methods.cutArea(to.query.id)
  //   }
  // },
  mounted: function () {
    _this = this
    common.allowDrag('menu')
    _this.axios.get('http://119.23.74.200:8888/Place/GetProvince')
      .then(function (response) {
        if (response.data.status === '0') {
          response.data.table.forEach(item => {
            _this.provinceData.push(item)
          })
        }
      }).catch(function (response) {
        _this.$message.error(response.data.msg)
      })
    _this.axios.get('http://119.23.74.200:8888/Place/PlaceType')
      .then(function (response) {
        if (response.data.status === '0') {
          response.data.table.forEach(item => {
            _this.placeType.push(item)
          })
        }
      }).catch(function (response) {
        _this.$message.error(response.data.msg)
      })
  },
  name: 'app',
  data () {
    return {
      menuClass: 'menuOut',
      currentMap: undefined,
      provinceData: [],
      placeType: [],
      protectArea: [],
      currentProvince: '',
      areaMenu: [],
      isSelected: false
    }
  },
  methods: {
    aerialShoot (url) {
      window.open(url)
    },
    getProtectArea (placeType) {
      if (_this.currentProvince === '') {
        _this.$message('请先选择省份')
        child.methods.addPolyline()
        return
      }
      _this.axios.get('http://119.23.74.200:8888/Place/GetPlace?Province=' + _this.currentProvince + '&PlaceType=' + placeType)
        .then(function (response) {
          _this.protectArea.splice(0, _this.protectArea.length)
          if (response.data.status === '0') {
            response.data.table.forEach(item => {
              _this.protectArea.push(item)
            })
          }
        }).catch(function (response) {
          _this.$message.error(response.data.msg)
        })
    },
    getPlaceType (province) {
      _this.currentProvince = province
    },
    cutArea (item) {
      _this.areaMenu.splice(0, _this.areaMenu.length)
      _this.isSelected = true
      child.methods.cutArea(item)
      child.methods.addMark(item)
      _this.areaMenu.push({name: '边界管理', path: '/HelloWorld'})
      _this.areaMenu.push({name: '动态消息', path: '#'})
      _this.areaMenu.push({name: '数据管理', path: '#'})
      _this.areaMenu.push({name: '数据分析', path: '#'})
    },
    menuMouseOver () {
      _this.menuClass = 'menuOver'
    },
    menuMouseOut () {
      _this.menuClass = 'menuOut'
    }
  }
}
</script>

<style>
a {
  text-decoration:none;
  color:#333;
}

hr {
  height:1px;
  border:none;
  border-top:1px dashed #CCCCCC;
}
.menuOver {
  position: absolute;
  top: 10px;
  left: 50px;
  opacity: 1;
  cursor: pointer;
  border-radius: 5px;
  z-index: 1;
}
.menuOut {
  position: absolute;
  top: 10px;
  left: 50px;
  opacity: 0.3;
  cursor: pointer;
  z-index: 1;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
