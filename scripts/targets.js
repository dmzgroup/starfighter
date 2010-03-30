var dmz = {}
,   MaxTargets = 10
,   targets = { count: 0, list: {} }
,   DeadState
,   Detonation
,   Forward
,   Right
,   Up
,   randomVector
,   rotate
,   newOri
,   baseStar
;

dmz.object = require("dmz/components/object");
dmz.event = require("dmz/components/event");
dmz.common = require("dmz/components/event/common");
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

baseStar = dmz.object.create("base-star");
dmz.object.position(baseStar, null, [0, 0, -5000]);
dmz.object.activate(baseStar);

randomVector = function (value) {

   var halfValue = 0;

   if (!value) { value = 250; }

   halfValue = value * 0.5;

   return dmz.vector.create (
      Math.random() * value - halfValue,
      Math.random() * value - halfValue,
      Math.random() * value - halfValue);
};


rotate = function (time, orig, target) {

   var diff = target - orig
   ,   max = time * Math.PI
   ;

   if (diff > Math.PI) { diff -= Math.PI * 2; }
   else if (diff < Math.PI)  { diff +=  Math.PI * 2; }

   if (Math.abs (diff) > max) {

      if (diff > 0) { target = orig + max; }
      else { target = orig - max }
   }

   return target;
};



newOri = function (obj, time, origOri, targetVec) {

   var result = dmz.matrix.create()
   ,   hvec = dmz.vector.create(targetVec)
   ,   heading
   ,   hcross
   ,   pitch
   ,   pcross
   ,   ncross
   ,   pm
   ;

   hvec:set_y (0.0)
   hvec = hvec.normalize ()

   heading = Forward.getAngle (hvec);

   hcross = Forward.cross(hvec).normalize();

   if (hcross.y < 0.0) { heading = (Math.PI * 2) - heading; }

   if (heading > Math.PI) { heading = heading - (Math.PI * 2); }
   else if (heading < -Math.PI) { heading = heading + (Math.PI * 2); }

   pitch = targetVec.getAngle(hvec);
   pcross = targetVec.cross(hvec).normalize();
   ncross = hvec.cross(pcross);

   if (ncross.y < 0.0) { pitch = (Math.PI * 2) - pitch; }

   if (obj.heading) {  heading = rotate (time, obj.heading, heading); }

   obj.heading = heading;

   if (obj.pitch) {  pitch = rotate (time, obj.pitch, pitch); }

   obj.pitch = pitch;

   pm = dmz.matrix.create().fromAxisAndAngle(Right, pitch);

   result = result.fromAxisAndAngle(Up, heading);

   result = result * pm;

   return result;
}



dmz.time.setRepeatingTimer(self, function (Delta) {

   var obj;

   while (targets.count < MaxTargets) {

      obj = dmz.object.create("raider");
      dmz.object.position(obj, null, randomVector ());
      dmz.object.activate(obj);

      targets.count++;
      targets.list[obj] = true;
   }
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
