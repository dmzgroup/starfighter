var dmz =
       { object: require("dmz/components/object")
       , event: require("dmz/components/event")
       , common: require("dmz/components/eventCommon")
       , overlay: require("dmz/components/overlay")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , mask: require("dmz/types/mask")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       , rotate: require("rotate")
       }
,   battlestar
,   autopilot = 0
,   light = dmz.overlay.lookup("autopilot-light")
,   start
//  Constants
,   Forward = dmz.vector.create(0, 0, -1)
,   Up = dmz.vector.create(0, 1, 0)
,   Right = dmz.vector.create(1, 0, 0)
,   Red = dmz.overlay.color("bar-red")
,   Yellow = dmz.overlay.color("bar-yellow")
,   Green = dmz.overlay.color("bar-green")
,   DeadState = dmz.defs.lookupState(dmz.defs.DeadStateName)
,   MaxSpeed = 55.556 // meters per second -> 200 kilometers per hour
,   Acceleration = 60
//  Functions
,   launchTimeSlice
,   landTimeSlice
;

if (!light) { self.log.error("Unable to find autopilot light"); }

launchTimeSlice = function (Delta) {

   var hil = dmz.object.hil()
   ,   pos
   ,   ori
   ,   vel
   ,   dir
   ,   state
   ;

   if (hil && (autopilot === 1)) {

      pos = dmz.object.position (hil);
      ori = dmz.object.orientation(hil);
      vel = dmz.object.velocity(hil);
      state = dmz.object.state(hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      if (!start) { start = pos; }

      if (!state || !state.contains(DeadState)) {

         dir = ori.transform(Forward);
         vel = vel.add(dir.multiplyConst(Acceleration * Delta));
         pos = pos.add(vel.multiplyConst(Delta));
      }

      if (pos.subtract(start).magnitude() > 50) {

         dmz.time.cancleTimer(self, launchTimeSlice);
         dmz.object.counter(hil, "autopilot", 0);
         start = undefined;
         if (light) { light.color(Red); }
      }

      dmz.object.position (hil, null, pos);
      dmz.object.orientation (hil, null, ori);
      dmz.object.velocity (hil, null, vel);
      dmz.object.state (hil, null, state);
   }
};


landTimeSlice = function (Delta) {

   var hil = dmz.object.hil()
   ,   target
   ,   hvec
   ,   hmat = dmz.matrix.create()
   ,   pvec
   ,   bsOri
   ,   pos
   ,   ori
   ,   targetOri
   ,   vel
   ,   dir
   ,   state
   ,   valid = true
   ;

   if (hil && battlestar) {

      target = dmz.object.position(battlestar);
      bsOri = dmz.object.orientation(battlestar);

      if (!target) { target = dmz.vector.create(); }
      if (!bsOri) { bsOri = dmz.matrix.create(); }

      pos = dmz.object.position(hil);
      ori = dmz.object.orientation(hil);
      vel = dmz.object.velocity(hil);
      state = dmz.object.state(hil);

      if (!pos) { pos = dmz.vector.create(); }
      if (!ori) { ori = dmz.matrix.create(); }
      if (!vel) { vel = dmz.vector.create(); }

      if ((autopilot === 0) || (autopilot === 3)) {

         target = target.add(bsOri.transform(dmz.vector.create(221.7, -50, -450)));

         if (bsOri.transform(Forward).getAngle(ori.transform(Forward)) <
               (Math.PI * 0.8)) {

            valid = false;
            if (light) { light.color(Red); }
         }
         else { dmz.object.counter(dmz.object.hil(), "autopilot", 3); }
      }
      else if (autopilot === 2) {

         target = target.add(bsOri.transform(dmz.vector.create(221.7, -60, -155.75)));
      }

      if (valid && (!state || !state.contains(DeadState))) {

         dir = target.subtract(pos);
         if (dir.magnitude() < 10) { dmz.object.counter(hil, "autopilot", 2); }

         targetOri = bsOri.multiply(dmz.matrix.create().fromAxisAndAngle(Up, Math.PI));

         ori = dmz.rotate.align(
            Delta,
            Math.PI * 0.25,
            ori,
            targetOri);

         vel = target.subtract(pos).normalize().multiplyConst(vel.magnitude());

         if (autopilot >= 2) { pos = pos.add(vel.multiplyConst(Delta)); }

         dmz.object.position(hil, null, pos);
         dmz.object.orientation(hil, null, ori);
         dmz.object.velocity(hil, null, vel);
         dmz.object.state(hil, null, state);
      }
   }
};


dmz.input.button.observe(self, function (Channel, Button) {

   if (Button.id === 1) {

      if ((autopilot === 1) && Button.value) {

         if (dmz.util.isUndefined(start)) {

            dmz.time.setRepeatingTimer(self, launchTimeSlice);
            dmz.common.createLaunch(dmz.object.hil());
         }
      }
      else if (autopilot === 2) {

         if (Button.value) {

            dmz.time.cancleTimer(self, landTimeSlice);
            dmz.object.counter(dmz.object.hil(), "autopilot", 0);
            if (light) { light.color(Red); }
         }
      }
      else if (autopilot === 3) {

         dmz.time.cancleTimer(self, landTimeSlice);
         dmz.object.counter(dmz.object.hil(), "autopilot", 0);
      }
      else if (autopilot === 0) {

         if (Button.value) {

            dmz.time.setRepeatingTimer(self, landTimeSlice);
         }
         else {

            dmz.time.cancleTimer(self, landTimeSlice);
            dmz.object.counter(dmz.object.hil(), "autopilot", 0);
         }
      }
   }
   else if ((Button.id === 3) && Button.value) {

      dmz.time.cancleTimer(self, landTimeSlice);
      dmz.object.position (dmz.object.hil(), null, dmz.vector.create());
      dmz.object.velocity (dmz.object.hil(), null, dmz.vector.create());
      dmz.object.orientation (dmz.object.hil(), null, dmz.matrix.create());
      dmz.object.counter (dmz.object.hil(), "autopilot", 1);
   }
});


dmz.object.counter.observe(self, "autopilot", function (handle, attr, value) {

   if (handle === dmz.object.hil ()) {

      autopilot = value;
      if (light) {

         if (autopilot == 0) { light.color(Red); }
	      else if (autopilot > 2) { light.color(Yellow); }
	      else if (autopilot > 0) { light.color(Green); }
      }
   }
});


dmz.object.flag.observe(self, "battlestar", function (handle, attr, value) {

   if (value && !battlestar) { battlestar = handle; }
});
