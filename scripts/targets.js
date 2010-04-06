var dmz = {}
,   MaxTargets = 100
,   TargetSpeed = 40
,   targets = { count: 0, list: {} }
,   DeadState
,   Detonation
,   Forward
,   Right
,   Up
,   StartDir
,   randomVector
,   rotate
,   newOri
,   baseStar
;

dmz.object = require("dmz/components/object");
dmz.event = require("dmz/components/event");
dmz.common = require("dmz/components/eventCommon");
dmz.time = require("dmz/runtime/time");
dmz.eventType = require("dmz/runtime/eventType");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");
dmz.mask = require("dmz/types/mask");
dmz.defs = require("dmz/runtime/definitions");
dmz.util = require("dmz/types/util");

DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName);
Detonation = dmz.eventType.lookup("Event_Detonation");

Forward = dmz.vector.create(0.0, 0.0, -1.0);
Right = dmz.vector.create(1.0, 0.0, 0.0);
Up = dmz.vector.create(0.0, 1.0, 0.0);
StartDir = dmz.matrix.create().fromAxisAndAngle(Up, Math.PI);

baseStar = dmz.object.create("base-star");
dmz.object.position(baseStar, null, [0, -100, -2000]);
dmz.object.activate(baseStar);

randomVector = function (value) {

   var halfValue = 0;

   if (!value) { value = 500; }

   halfValue = value * 0.5;

   return dmz.vector.create (
      Math.random() * value - halfValue,
      Math.random() * value - halfValue,
      Math.random() * value - halfValue);
};


rotate = function (time, orig, target) {

   var result = target
   ,   diff = target - orig
   ,   max = time * Math.PI
   ;

   if (diff > Math.PI) { diff -= Math.PI * 2; }
   else if (diff < -Math.PI)  { diff += Math.PI * 2; }

   if (Math.abs (diff) > max) {

      if (diff > 0) { result = orig + max; }
      else { result = orig - max }
   }

   return result;
};



newOri = function (obj, time, targetVec) {

   var result = dmz.matrix.create()
   ,   hvec = dmz.vector.create(targetVec)
   ,   heading
   ,   hcross
   ,   pitch
   ,   pcross
   ,   ncross
   ,   pm
   ;

   hvec.y = 0.0;
   hvec = hvec.normalized();
   heading = Forward.getAngle(hvec);

   hcross = Forward.cross(hvec).normalized();

   if (hcross.y < 0.0) { heading = (Math.PI * 2) - heading; }

   if (heading > Math.PI) { heading = heading - (Math.PI * 2); }
   else if (heading < -Math.PI) { heading = heading + (Math.PI * 2); }

   pitch = targetVec.getAngle(hvec);
   pcross = targetVec.cross(hvec).normalized();
   ncross = hvec.cross(pcross);

   if (ncross.y < 0.0) { pitch = (Math.PI * 2) - pitch; }

   obj.heading = rotate (time, obj.heading, heading);

   obj.pitch = rotate (time, obj.pitch, pitch);

   if (dmz.util.isZero(pitch - obj.pitch) && dmz.util.isZero(heading - obj.heading)) {

      obj.onTarget = true;
   }

   pm = dmz.matrix.create().fromAxisAndAngle(Right, obj.pitch);

   result = result.fromAxisAndAngle(Up, obj.heading);

   result = result.multiply(pm);

   return result;
};


dmz.time.setRepeatingTimer(self, function (Delta) {

   var handle, obj, count = 0;

   while ((count < 10) && (targets.count < MaxTargets)) {

      count++;
      handle = dmz.object.create("raider");
      dmz.object.position(handle, null, randomVector().add([0,0,-1500]));
      dmz.object.orientation(handle, null, StartDir);
      dmz.object.velocity(handle, null, [0, 0, TargetSpeed]);
      dmz.object.activate(handle);

      targets.count++;

      obj = {
         handle: handle,
         start: dmz.object.position(handle),
         point: randomVector(50),
         heading: Math.PI,
         pitch: 0,
         onTarget: false,
         dir: Forward
      };

      obj.distance = obj.start.subtract(obj.point).magnitude();

      targets.list[handle] = obj;
   }

   Object.keys(targets.list).forEach (function (key) {

      var obj = targets.list[key]
      ,   handle = obj.handle
      ,   pos = dmz.object.position(handle)
      ,   vel = dmz.object.velocity(handle)
      ,   offset = obj.point.subtract(pos)
      ,   targetDir = offset.normalized()
      ,   ori = obj.onTarget ?  null : newOri(obj, Delta, targetDir)
      ;

      if (obj.start.subtract(pos).magnitude() > obj.distance) {

         obj.point = randomVector();
         obj.start = pos;
         obj.distance = obj.start.subtract(obj.point).magnitude();
         obj.onTarget = false;
      }

      if (ori) { obj.dir = ori.transform(Forward); }

      vel = obj.dir.multiplyConst(vel.magnitude());
      //vel = targetDir.multiplyConst(vel.magnitude());

      pos = pos.add(vel.multiplyConst(Delta));
      dmz.object.position(handle, null, pos);
      if (ori) { dmz.object.orientation(handle, null, ori); }
      dmz.object.velocity(handle, null, vel);
   });
});

dmz.event.close.observe(self, Detonation, function (Event) {

   var object = dmz.event.objectHandle(Event, dmz.event.TargetAttribute);

   if (targets.list[object]) {

      dmz.common.createDetonation(object);
      dmz.object.destroy(object);
      delete targets.list[object];
      targets.count--;
   }
});
