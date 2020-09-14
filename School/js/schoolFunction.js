// 添加primitives
function addPrimitive(id, url, modelMatrix, scale) {
    if (modelMatrix != undefined) {//Glft文件
        var position = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(modelMatrix.lon, modelMatrix.lat, modelMatrix.height)
        );
        var model = scene.primitives.add(Cesium.Model.fromGltf({
            id: id,
            url: url,
            modelMatrix: position,
            scale: scale
        }));
    }
    else {//3DTile文件
        var model = scene.primitives.add(new Cesium.Cesium3DTileset({
            url: url,
        }))
    }
    return model;
}

//添加entities
function addEntity(id, position, orientation, model, avlTime) {
    if (avlTime != undefined) {//定义开始和结束位置
        var availability = new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: avlTime.start,
                stop: Cesium.JulianDate.addSeconds(
                    avlTime.start,
                    avlTime.du,
                    new Cesium.JulianDate()
                )
            })
        ]);
    }
    //静态坐标
    if (position.lon != undefined) {
        var entityPosition = Cesium.Cartesian3.fromDegrees(position.lon, position.lat, position.height)
    }
    //动态坐标
    else var entityPosition = position;
    //静态朝向
    if (orientation != undefined) {
        if (orientation instanceof Array) {
            var entityOrientation = {
                heading: orientation.heading,
                pitch: orientation.pitch,
                roll: orientation.roll
            }
        }
        //动态朝向
        else { var entityOrientation = new Cesium.VelocityOrientationProperty(orientation); }
    }
    if (model.dimensions != undefined) {//正方形
        var model = viewer.entities.add({
            id: id,
            availability: availability,
            position: entityPosition,
            orientation: entityOrientation,
            box: {
                dimensions: model.dimensions,
                material: model.material
            },
            info: model.info
        });
    }
    else if (model.topRadius != undefined) {//圆柱
        var model = viewer.entities.add({
            id: id,
            availability: availability,
            position: entityPosition,
            orientation: entityOrientation,
            cylinder: {
                length: model.length,
                topRadius: model.topRadius,
                bottomRadius: model.bottomRadius,
                material: model.material
            },
            info: model.info
        });
    }
    else if (model.url != undefined) {//Billboard
        var model = viewer.entities.add({
            id: id,
            position: entityPosition,
            billboard: {
                image: model.url,
                scale: model.scale,
                translucencyByDistance: new Cesium.NearFarScalar(
                    1.4e3,
                    0.05,
                    1.5e3,
                    2.0
                ),
                color: model.color,
                width: model.width,
                height: model.height
            },
            info: model.info
        })
    }
    else {//带uri的模型
        var model = viewer.entities.add({
            id: id,
            availability: availability,
            position: entityPosition,
            orientation: entityOrientation,
            model: {
                uri: model.uri,
                scale: model.scale
            },
            info: model.info
        });
    }
    return model;

}

//瓦片位置与旋转
function changePosition(model, lon, lat, height, roll, scale) {
    model.readyPromise.then(function (argument) {
        var position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
        var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        var rotationZ = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(roll)));
        Cesium.Matrix4.multiply(mat, rotationZ, mat);
        if (scale != undefined){
        var modelScale = Cesium.Matrix4.fromUniformScale(scale);
        Cesium.Matrix4.multiply(mat,modelScale,mat);
        }
        model._root.transform = mat;
    })
}

// 控制prinitive旋转角度
function controlPitchRoll(model, Pradian, Rradian) {
    const Rangel = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(Rradian));
    const Rrotation = Cesium.Matrix4.fromRotationTranslation(Rangel);
    Cesium.Matrix4.multiply(model.modelMatrix, Rrotation, model.modelMatrix);
    const Pangel = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(Pradian));
    const Protation = Cesium.Matrix4.fromRotationTranslation(Pangel);
    Cesium.Matrix4.multiply(model.modelMatrix, Protation, model.modelMatrix);
}

// 控制模型自带动画
function animationSet(id, model, startTime, delay, remove, multiplier, stopTime) {
    if (delay === undefined) { delay = 0; }
    if (remove === undefined) { remove = false; }
    if (multiplier === undefined) { multiplier = 0.5; }
    if (stopTime === undefined) { stopTime = Cesium.JulianDate.addSeconds(startTime, 99999999, new Cesium.JulianDate()) }
    Cesium.when(model.readyPromise).then(function (model) {
        model.activeAnimations.add({          //index标识给某一个动画添加播放时间
            index: id,
            startTime: startTime,
            delay: delay,
            stopTime: stopTime,
            removeOnStop: remove,
            multiplier: multiplier,
            loop: Cesium.ModelAnimationLoop.REPEAT,
        });
        // model.activeAnimations.addAll({
        //     loop: Cesium.ModelAnimationLoop.REPEAT,
        // })
    });
}

// 设置路线
function setPath(property, time, lon, lat, height) {
    var Time = Cesium.JulianDate.addSeconds(
        start,
        time,
        new Cesium.JulianDate
    );
    var position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    property.addSample(Time, position);
    return property;
}

//改变货物高度
function arriveChangeHeight(entitystart, entityEnd, height) {
    var flag = 0;
    viewer.clock.onTick.addEventListener(function (clock) {
        var boxPosition = entitystart.position.getValue(clock.currentTime);
        var cylinderPosition = entityEnd.position.getValue();
        if (boxPosition) {
            var bx = boxPosition.x;
            var by = boxPosition.y;
            var bz = boxPosition.z;
            var cx = cylinderPosition.x;
            var cy = cylinderPosition.y;
            var cz = cylinderPosition.z;
            if (bx - cx < 0) { var x = -(bx - cx) } else { var x = bx - cx };
            if (by - cy < 0) { var y = -(by - cy) } else { var y = by - cy };
            if (bz - cz < 0) { var z = -(bz - cz) } else { var z = bz - cz };
            if (flag == 0) {
                if (x + y + z < 1200) {
                    entityEnd.cylinder.length += height;
                    flag = 1;
                }
            }
        }
    });
}

// // 监听事件
// // 相机高度
// function cameraHeight() {
//     viewer.scene.camera.moveEnd.addEventListener(function () {
//         console.log(viewer.camera.getMagnitude());
//     })
// }
var leftClick = Cesium.ScreenSpaceEventType.LEFT_CLICK//左键单击
var leftDoubleClick = Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK//左键双击
var leftDown = Cesium.ScreenSpaceEventType.LEFT_DOWN//左键按下
var leftUp = Cesium.ScreenSpaceEventType.LEFT_UP//左键抬起

// 给函数赋予点击事件
function addClick(usefunction, click) {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        var pick = viewer.scene.pick(movement.position);
        if (Cesium.defined(pick)) {
            //给方法添加点击事件
            if (usefunction == "showSchool") {
                showSchool(pick);
            }
            if (usefunction == "flyToSchool") {
                flyToSchool(pick);
            }
        }
        else { document.getElementById('information').style.display = "none" }
    }, click);
}

// 显示信息框
function showSchool(pick) {
    if (pick.id != undefined) {
        //隐藏->显示
        document.getElementById('information').style.display = "block";
        document.getElementById("name").innerHTML = pick.id._id;
        var re = pick.id._info;
        document.getElementById("massageBox").innerHTML = re;
    }
}

// 镜头拉近
function flyToSchool(pick) {
    // 笛卡尔坐标转换为经纬度
    var cartesian3 = pick.primitive._position;
    var cartograhphic = Cesium.Cartographic.fromCartesian(cartesian3);
    var lon = Cesium.Math.toDegrees(cartograhphic.longitude) + 0.002;
    var lat = Cesium.Math.toDegrees(cartograhphic.latitude)-0.008;
    var position = Cesium.Cartesian3.fromDegrees(lon, lat, 600);
    viewer.camera.flyTo({
        destination: position,
        orientation: {
            heading: 6.226593217462346,
            pitch: -0.5395921177790024,
            roll: 6.282977633477891
        }
    });
    document.getElementById('information').style.display = 'none';
}

//回到主页
function flyToHome(destination) {
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (commandInfo) {
        viewer.camera.flyTo({
            // destination: cameraDestination,
            // orientation: cameraOrientation
            destination: destination
        });
        commandInfo.cancel = true;
    });
}

//显示经纬度
function showLaLon() {
    var entity = viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: "14px monospace",
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    // Mouse over the globe to see the cartographic position
    handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function (movement) {
        var cartesian = viewer.camera.pickEllipsoid(
            movement.endPosition,
            scene.globe.ellipsoid
        );
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(
                cartographic.longitude
            ).toFixed(5);
            var latitudeString = Cesium.Math.toDegrees(
                cartographic.latitude
            ).toFixed(5);

            entity.position = cartesian;
            entity.label.show = true;
            entity.label.text =
                "Lon: " +
                ("   " + longitudeString) +
                "\u00B0" +
                "\nLat: " +
                ("   " + latitudeString) +
                "\u00B0";
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}
