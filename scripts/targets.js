var dmz =
       { object: require("dmz/components/object")
       , event: require("dmz/components/event")
       , common: require("dmz/components/eventCommon")
       , time: require("dmz/runtime/time")
       , eventType: require("dmz/runtime/eventType")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       }
  , targets = { count: 0, list: {} }
//  Constants
  , MaxTargets = 200
  , TargetSpeed = 40
  , KillAttribute = dmz.defs.createNamedHandle("Event_Kill_Attribute")
  , DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
  , Detonation = dmz.eventType.lookup("Event_Detonation")
  , Forward = dmz.vector.create(0.0, 0.0, -1.0)
  , Right = dmz.vector.create(1.0, 0.0, 0.0)
  , Up = dmz.vector.create(0.0, 1.0, 0.0)
  , StartDir = dmz.matrix.create().fromAxisAndAngle(Up, Math.PI)
  , BaseStar = dmz.object.create("base-star")
//  Functions
  , randomVector
  , rotate
  , newOri
  ;

dmz.object.position(BaseStar, null, [0, 0, -2000]);
dmz.object.activate(BaseStar);

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
     , diff = target - orig
     , max = time * Math.PI
     ;

   if (diff > Math.PI) { diff -= Math.PI * 2; }
   else if (diff < -Math.PI)  { diff += Math.PI * 2; }

   if (Math.abs (diff) > max) {

      if (diff > 0) { result = orig + max; }
      else { result = orig - max; }
   }

   return result;
};



newOri = function (obj, time, targetVec) {

   var result = dmz.matrix.create()
     , hvec = dmz.vector.create(targetVec)
     , heading
     , hcross
     , pitch
     , pcross
     , ncross
     , pm
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

      obj = 
         { handle: handle
         , start: dmz.object.position(handle)
         , point: randomVector(50)
         , heading: Math.PI
         , pitch: 0
         , onTarget: false
         , dir: Forward
         };

      obj.distance = obj.start.subtract(obj.point).magnitude();

      targets.list[handle] = obj;
   }

   Object.keys(targets.list).forEach (function (key) {

      var obj = targets.list[key]
        , handle = obj.handle
        , pos = dmz.object.position(handle)
        , vel = dmz.object.velocity(handle)
        , offset = obj.point.subtract(pos)
        , targetDir = offset.normalize()
        , ori = obj.onTarget ?  null : newOri(obj, Delta, targetDir)
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

   var target = dmz.event.objectHandle(Event, dmz.event.TargetAttribute)
     , source = dmz.event.objectHandle(Event, dmz.event.SourceAttribute)
     , out
     ;

   if (targets.list[target]) {

      out = dmz.common.createOpenDetonation(target);
      if (source) { dmz.event.objectHandle(out, KillAttribute, source); }
      dmz.common.close(out);
      dmz.object.destroy(target);
      delete targets.list[target];
      targets.count--;
   }
});
