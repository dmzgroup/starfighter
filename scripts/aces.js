var dmz = {}
,   Speed = 0
,   MaxAces = 1
,   aces = { count: 0, list: {} }
,   LaunchMsg
,   DeadState
,   Detonation
,   Forward
,   Right
,   Up
,   TailOffset
,   StartDir
,   TargetType
,   targetList = {}
,   randomVector
,   rotate
,   newOri
,   findTarget
;

dmz.common = require("dmz/components/eventCommon");
dmz.data = require("dmz/runtime/data");
dmz.defs = require("dmz/runtime/definitions");
dmz.event = require("dmz/components/event");
dmz.eventType = require("dmz/runtime/eventType");
dmz.isect = require("dmz/components/isect");
dmz.mask = require("dmz/types/mask");
dmz.matrix = require("dmz/types/matrix");
dmz.message = require("dmz/runtime/messaging");
dmz.object = require("dmz/components/object");
dmz.time = require("dmz/runtime/time");
dmz.util = require("dmz/types/util");
dmz.vector = require("dmz/types/vector");

DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName);
Detonation = dmz.eventType.lookup("Event_Detonation");
LaunchMsg = dmz.message.create("Raider_Launch_Message");

Forward = dmz.vector.create(0.0, 0.0, -1.0);
Right = dmz.vector.create(1.0, 0.0, 0.0);
Up = dmz.vector.create(0.0, 1.0, 0.0);
TailOffset = dmz.vector.create(0.0, 0.0, 30.0);
StartDir = dmz.matrix.create().fromAxisAndAngle(Up, Math.PI);
TargetType = self.config.objectType("target-type.name", "colonial-vehicle");

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
   hvec = hvec.normalize();
   heading = Forward.getAngle(hvec);

   hcross = Forward.cross(hvec).normalize();

   if (hcross.y < 0.0) { heading = (Math.PI * 2) - heading; }

   if (heading > Math.PI) { heading = heading - (Math.PI * 2); }
   else if (heading < -Math.PI) { heading = heading + (Math.PI * 2); }

   pitch = targetVec.getAngle(hvec);
   pcross = targetVec.cross(hvec).normalize();
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


findTarget = function () {

   var keys = Object.keys(targetList)
   ,   result
   ,   length = 0
   ,   which = 0
   ;

   if (keys) {

      length = keys.length;
      which = Math.floor((length * Math.random()));
      result = targetList[keys[which]]
   }

   return result
};


dmz.time.setRepeatingTimer(self, function (Delta) {

   var handle, obj, count = 0;

   while ((count < 10) && (aces.count < MaxAces)) {

      count++;
      handle = dmz.object.create("raider");
      dmz.object.position(handle, null, randomVector().add([0,0,-100]));
      dmz.object.orientation(handle, null, StartDir);
      dmz.object.velocity(handle, null, [0, 0, Speed]);
      dmz.object.activate(handle);

      aces.count++;

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

      aces.list[handle] = obj;
   }

   Object.keys(aces.list).forEach (function (key) {

      var obj = aces.list[key]
      ,   handle = obj.handle
      ,   pos = dmz.object.position(handle)
      ,   vel = dmz.object.velocity(handle)
      ,   ori = dmz.object.orientation(handle)
      ,   offset
      ,   speed
      ,   targetPos
      ,   targetOri
      ,   targetVel
      ,   targetDir
      ,   targetOffset
      ,   distance
      ;

      if (!obj.target) { obj.target = findTarget(); }

      if (obj.target) {

         targetPos = dmz.object.position(obj.target);
         targetOri = dmz.object.orientation(obj.target);
         targetVel = dmz.object.velocity(obj.target);

         if (targetPos && targetOri && targetVel) {

            targetOffset = targetOri.transform(TailOffset);

            targetPos = targetPos.add(targetOffset.add(randomVector(1)));

            offset = targetPos.subtract(pos); 
            targetDir = offset.normalize();

            ori = newOri(obj, Delta, targetDir);

            distance = offset.magnitude();

            speed = targetVel.magnitude();

            speed -= 0.1;

            if (speed < 0) { speed = 0; }

            if ((distance < 100) && (distance > 10)) {

               LaunchMsg.send(dmz.data.wrapHandle(handle));
            }
         }
      }

      if (!speed) { speed = vel.magnitude(); }

      if (ori) { obj.dir = ori.transform(Forward); }

      vel = obj.dir.multiplyConst(speed);

      pos = pos.add(vel.multiplyConst(Delta));
      dmz.object.position(handle, null, pos);
      if (ori) { dmz.object.orientation(handle, null, ori); }
      dmz.object.velocity(handle, null, vel);
   });
});


dmz.event.close.observe(self, Detonation, function (Event) {

   var object = dmz.event.objectHandle(Event, dmz.event.TargetAttribute);

   if (aces.list[object]) {

      dmz.common.createDetonation(object);
      dmz.object.destroy(object);
      delete aces.list[object];
      aces.count--;
   }
});


dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(TargetType)) { targetList[handle] = handle; }
});


dmz.object.destroy.observe(self, function (handle) {

   if (targetList[handle]) { delete (targetList[handle]); }
});
