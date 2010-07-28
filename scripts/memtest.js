var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       }
  , objects = { count: 0, list: {} }
//  Constants
  , MaxTargets = 200
  , Forward = dmz.vector.Forward
  , Right = dmz.vector.Right
  , Up = dmz.vector.Up
  , StartDir = dmz.matrix.create().fromAxisAndAngle(Up, Math.PI)
//  Functions
  , randomVector
  ;

randomVector = function (value) {

   var halfValue = 0;

   if (!value) { value = 500; }

   halfValue = value * 0.5;

   return dmz.vector.create (
      Math.random() * value - halfValue,
      Math.random() * value - halfValue,
      Math.random() * value - halfValue);
};


dmz.time.setRepeatingTimer(self, function (Delta) {

   var handle, count = 0;

   while ((count < 10) && (objects.count < MaxTargets)) {

      count++;
      handle = dmz.object.create("raider");
      dmz.object.position(handle, null, randomVector());
      dmz.object.orientation(handle, null, StartDir);
      dmz.object.velocity(handle, null, [0, 0, 0]);
      dmz.object.activate(handle);

      objects.count++;

      objects.list[handle] = handle;
   }

   Object.keys(objects.list).forEach (function (key) {

      var obj = objects.list[key]
        ;

      if (Math.random() > 0.5) {

         dmz.object.destroy(obj);
         delete objects.list[key];
         objects.count--;
      }
   });
});

