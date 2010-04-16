var dmz =
       { object: require("dmz/components/object")
       , event: require("dmz/components/event")
       , input: require("dmz/components/input")
       , isect: require("dmz/components/isect")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       }
,   frame =
       { nose: dmz.vector.create([0, 1, -4.1])
       , tail: dmz.vector.create([0, 1, 3.861])
       , center: dmz.vector.create([0, 1, -1])
       , left: dmz.vector.create([-2.431321, 0.060074, 3.237302])
       , right: dmz.vector.create([2.431321, 0.060074, 3.237302])
       , top: dmz.vector.create([0, 2.85, 3.387])
       }
,   controls = { thrust: 0, roll: 0, yaw: 0, pitch: 0 }
,   active = 0
//  Constants
,   DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
,   XPitch = dmz.vector.create(1, 0, 0)
,   YYaw = dmz.vector.create(0, 1, 0)
,   ZRoll = dmz.vector.create(0, 0, -1)
,   MaxSpeed = 55.556 // meters per second -> 200 kilometers per hour
//  Functions
,   updateFrame
;

updateFrame = function (pos, dir, frame) {

   var result = {}, keys = Object.keys(frame);
   keys.forEach (function (key) { result[key] = dir.transform(frame[key]).add(pos); });
   return result;
}

dmz.time.setRepeatingTimer(self, function (Delta) {

   var hil = dmz.object.hil()
   ,   state = dmz.object.state(hil)
   ,   speed = 0
   ,   dir = dmz.vector.create(0, 0, -1)
   ,   pos
   ,   oldPos
   ,   vel
   ,   ori
   ,   point
   ,   normal
   ,   vec
   ,   pMat
   ,   yMat
   ,   rMat
   ,   DeltaXPi = Delta * Math.PI
   ,   cframe
   ;

   if (hil && (active > 0)) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation (hil);
      vel = dmz.object.velocity (hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      speed = vel.magnitude();

      if (!state || !state.contains(DeadState)) {

         oldPos = pos.copy ();

         pMat = dmz.matrix.create().fromAxisAndAngle(XPitch, controls.pitch * DeltaXPi);
         yMat = dmz.matrix.create().fromAxisAndAngle(YYaw, controls.yaw * DeltaXPi);
         rMat = dmz.matrix.create().fromAxisAndAngle(ZRoll, controls.roll * DeltaXPi);

         ori = ori.multiply(yMat.multiply(pMat.multiply(rMat)));

         dir = ori.transform(dir);

         if (controls.thrust < 0) { speed += controls.thrust * Delta * 50;}
         else { speed += controls.thrust * Delta * 15; }

         if (speed < 0) { speed = 0; }
         else if (speed > MaxSpeed) { speed = MaxSpeed; }

         vel = dir.multiplyConst(speed);

         pos = pos.add(vel.multiplyConst(Delta));

         cframe = updateFrame (pos, ori, frame);

         dmz.isect.disable(hil);

         dmz.isect.doIsect([
            { start: cframe.nose, end: cframe.tail, callback: function (value) {

               point = value.point;
               normal = value.normal;
               self.log.warn("Nose collision", value.object);
            }},
            { start: cframe.center, end: cframe.left, callback: function (value) {

               point = value.point;
               normal = value.normal;
               self.log.warn("Left collision", value.object);
            }},
            { start: cframe.center, end: cframe.right, callback: function (value) {

               point = value.point;
               normal = value.normal;
               self.log.warn("Right collision", value.object);
            }},
            { start: cframe.center, end: cframe.top, callback: function (value) {

               point = value.point;
               normal = value.normal;
               self.log.warn("Top collision", value.object);
            }},
         ]);

         dmz.isect.enable(hil);

/*
         if (normal && point) {

            normal = normal.normalize();

            pos = oldPos;

            vec = point.subtract(pos);

            if (vec.getAngle(normal) < (Math.Pi * 0.5)) {

               normal = normal.multiplyConst(-1);
            }

            vec = vel.normalize();
            vel = normal.multiplyConst(2 * vec.dot(normal)).subtract(vec).multiplyConst(speed);

            if (!state) { state = dmz.mask.create(); }
            state = state.or(DeadState);
         }
*/
      }
      else {

         dir = vel.normalize();

         speed -= Delta * 2;

         if (speed < 0) { speed = 0; }

         vel = dir.multiplyConst(speed);

         pos = pos.add(vel.multiplyConst(Delta));
      }

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
      dmz.object.state (hil, null, state);
   }
});

dmz.input.channel.observe(self, function (Channel, State) {

   if (State) { active++; }
   else { active--; }
});

dmz.input.axis.observe(self, function (Channel, Axis) {

   var value = Axis.value * Axis.value * (Axis.value > 0 ? 1 : -1);

   if (Math.abs (value) < 0.01) { value = 0; }

   if (Axis.id == 1) { // Roll

      controls.roll = value;
   }
   else if (Axis.id == 2) { // thrust

      controls.thrust = -value;
   }
   else if (Axis.id == 3) { // Yaw

      controls.yaw = -value;
   }
   else if (Axis.id == 4) { // Pitch

      controls.pitch = value;
   }
});
