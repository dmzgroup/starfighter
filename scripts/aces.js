var dmz =
       { common: require("dmz/components/eventCommon")
       , data: require("dmz/runtime/data")
       , defs: require("dmz/runtime/definitions")
       , event: require("dmz/components/event")
       , eventType: require("dmz/runtime/eventType")
       , isect: require("dmz/components/isect")
       , mask: require("dmz/types/mask")
       , matrix: require("dmz/types/matrix")
       , message: require("dmz/runtime/messaging")
       , object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , util: require("dmz/types/util")
       , vector: require("dmz/types/vector")
       }
  , aces = { count: 0, list: {} }
  , targetList = {}
//  Constants
  , TurnRate = Math.PI * 0.5
  , Speed = 40
  , MaxAces = 5
  , DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
  , Detonation = dmz.eventType.lookup("Event_Detonation")
  , LaunchMsg = dmz.message.create(self.config.string(
       "launch-message.name",
       "Raider_Launch_Message"))
  , KillAttribute = dmz.defs.createNamedHandle("Event_Kill_Attribute")
  , Forward = dmz.vector.Forward
  , Right = dmz.vector.Right
  , Up = dmz.vector.Up
  , TailOffset = dmz.vector.create(0.0, 0.0, 30.0)
  , StartDir = dmz.matrix.create().fromAxisAndAngle(Up, Math.PI)
  , AceType = self.config.objectType("ace-type.name", "raider")
  , TargetType = self.config.objectType("target-type.name", "colonial-fighter")
  , Lead = self.config.number("target-lead.value", 6)
//  Functions
  , randomVector
  , rotate
  , newOri
  , findTarget
  ;



randomVector = function (value) {

   var halfValue = 0;

   if (!value) { value = 500; }

   halfValue = value * 0.5;

   return dmz.vector.create(
      Math.random() * value - halfValue,
      Math.random() * value - halfValue,
      Math.random() * value - halfValue);
};


rotate = function (time, orig, target) {

   var result = target
   ,   diff = target - orig
   ,   max = time * TurnRate
   ;

   if (diff > Math.PI) { diff -= Math.PI * 2; }
   else if (diff < -Math.PI)  { diff += Math.PI * 2; }

   if (Math.abs(diff) > max) {

      if (diff > 0) { result = orig + max; }
      else { result = orig - max }
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

   obj.heading = rotate(time, obj.heading, heading);

   obj.pitch = rotate(time, obj.pitch, pitch);

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
     , result
     ;

   if (keys) { result = targetList[keys[Math.floor((keys.length * Math.random()))]]; }

   return result
};


dmz.time.setRepeatingTimer(self, function (Delta) {

   var handle, obj, count = 0;

   while ((count < 10) && (aces.count < MaxAces)) {

      count++;
      handle = dmz.object.create(AceType);
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
        , handle = obj.handle
        , pos = dmz.object.position(handle)
        , vel = dmz.object.velocity(handle)
        , ori = dmz.object.orientation(handle)
        , origPos
        , offset
        , speed
        , targetPos
        , targetOri
        , targetVel
        , targetDir
        , targetOffset
        , distance
        ;

      if (!obj.flyoff && !obj.target) { obj.target = findTarget(); }

      if (obj.target) {

         targetPos = dmz.object.position(obj.target);
         targetOri = dmz.object.orientation(obj.target);
         targetVel = dmz.object.velocity(obj.target);

         if (targetPos && targetOri && targetVel) {

            targetPos = targetPos.add(targetOri.transform(Forward.multiplyConst(Lead)));
            offset = targetPos.subtract(pos); 
            targetDir = offset.normalize();

            if (!obj.flyoff) { ori = newOri(obj, Delta, targetDir); }

            distance = offset.magnitude();

            if ((distance < 200) && (distance > 10)) {

               if (ori.transform(Forward).getAngle(offset) < Math.PI * 0.1) {

                  if (obj.delay) {

                     obj.delay -= Delta;

                     if (obj.delay <= 0) {

                        obj.delay = undefined;
                        obj.fire = Math.random();
                     }
                  }
                  else {

                     if (!obj.fire) { obj.fire = Math.random(); }

                     obj.fire -= Delta;

                     if (obj.fire <= 0) {

                        obj.fire = undefined;
                        obj.delay = Math.random();
                     }
          
                     LaunchMsg.send(dmz.data.wrapHandle(handle));
                  }
               }
            }

            if (!obj.flyoff && (distance <= 30)) {

               obj.flyoff = (Math.random() * 100) + 100;
            }
         }
         else if (!dmz.object.isObject (obj.target)) { obj.target = undefined; }
      }

      if (!speed) { speed = vel.magnitude(); }

      if (ori) { obj.dir = ori.transform(Forward); }

      vel = obj.dir.multiplyConst(speed);

      origPos = pos;
      pos = pos.add(vel.multiplyConst(Delta));

      if (obj.flyoff) {

         obj.flyoff -= pos.subtract(origPos).magnitude();

         if (obj.flyoff <= 0) {

            obj.flyoff = undefined;
            obj.target = undefined;
         }
      }

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

   if (aces.list[target]) {

      out = dmz.common.createOpenDetonation(target);
      if (source) { dmz.event.objectHandle(out, KillAttribute, source); }
      dmz.common.close(out);
      dmz.object.destroy(target);
      delete aces.list[target];
      aces.count--;
   }
});


dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(TargetType) && !aces.list[handle]) { targetList[handle] = handle; }
});


dmz.object.destroy.observe(self, function (handle) {

   if (targetList[handle]) { delete (targetList[handle]); }
});


