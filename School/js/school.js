var viewer = new Cesium.Viewer('cesiumContainer', {
    shouldAnimate: true,
    selectionIndicator: true,
    infoBox: false,
    homeButton: true
});
viewer.resolutionScale = window.devicePixelRatio;//调整分辨率
//是否开启抗锯齿
viewer.scene.fxaa = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
const scene = viewer.scene;
showLaLon();//显示经纬度
addClick("showSchool", leftClick);//点击显示详情
addClick("flyToSchool", leftDoubleClick);//双击图标

//相机位置
var cameraDestination = new Cesium.Cartesian3(-2116260.041781177, 4811068.2378241665, 3631783.998623431);
viewer.scene.camera.setView({
    destination: cameraDestination,
})
flyToHome(cameraDestination);

//Billboards
var bill = { url: "../img/HeNanMuYe.jpg", scale: 0.18, info: "河南牧业经济学院北林校区隶属河南牧业经济学院，位于河南郑州，内有，食品工程系，能源与动力系，自动化与控制系，是省属公办全日制普通本科院校、河南省第二批转型发展试点高校。" };
var billPosition = { lon: 113.68786, lat: 34.80337, height: 0 }
var Billboard01 = addEntity("河南牧业经济学院(北林校区)", billPosition, undefined, bill);
bill.info = "河南省郑州市金水区龙子湖内环路与明理路交汇处"
billPosition = { lon: 113.80910, lat: 34.80529, height: 0 }
var Billboard02 = addEntity("河南牧业经济学院(龙子湖校区)", billPosition, undefined, bill);


//添加学校模型
var tilesetSport = addPrimitive("体育馆", "../model/BatchedSport/tileset.json")
var longitude = 113.68786;
var latitude = 34.80337;
height = 0;
roll = 0;
changePosition(tilesetSport, longitude, latitude, height, roll, 3.0);
//8个宿舍楼
longitude = 113.68910;
latitude = 34.80337;
var tilesetSchool = [];
for (var i = 0; i < 16; i++) {
    tilesetSchool[i] = addPrimitive("教学楼", "../model/schoolCollection/tileset.json")
    changePosition(tilesetSchool[i], longitude, latitude, height, roll);
    latitude += 0.0005;
    if (i == 7) { longitude += 0.0015; latitude = 34.80337 }
}


