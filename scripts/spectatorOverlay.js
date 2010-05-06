var dmz =
       { object: require("dmz/components/object")
       , overlay: require("dmz/components/overlay")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , messaging: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       }
  , mode = dmz.overlay.lookup("mode")
  , camera = dmz.overlay.lookup("camera")
  , posX = dmz.overlay.lookup("pos x")
  , posY = dmz.overlay.lookup("pos y")
  , posZ = dmz.overlay.lookup("pos z")
  , heading = dmz.overlay.lookup("heading")
  , text =
       { mode: mode.text()
       , camera: camera.text()
       , posX: posX.text()
       , posY: posY.text()
       , posZ: posZ.text()
       , heading: heading.text()
       }
//  Constants
  , Forward = dmz.vector.create(0, 0, -1)
  , ToDegrees = 180 / Math.PI
  , TetherChannel = dmz.defs.createNamedHandle("tether-portal")
  , WatchChannel = dmz.defs.createNamedHandle("watch-portal")
//  Functions 
  , channelState
  ;


channelState = function (channel, state) {

   if (state) {

      if (channel === TetherChannel) {

         mode.text(text.mode + "Free Fly");
         camera.text(text.camera + "Fixed");
      }
      else if (channel === WatchChannel) {

         mode.text(text.mode + "Follow");
         camera.text(text.camera + "Watch");
      }
   }
};


dmz.time.setRepeatingTimer (self,  function (time) {

   var hil = dmz.object.hil()
     , pos
     , ori
     , hvec
     , hval
     ;

   if (hil) {

      pos = dmz.object.position(hil);
      ori = dmz.object.orientation(hil);

      if (pos) {

         posX.text(text.posX + pos.x.toFixed(1));
         posY.text(text.posY + pos.y.toFixed(1));
         posZ.text(text.posZ + pos.z.toFixed(1));
      }

      if (ori) {

         hvec = ori.transform(Forward);
         hvec.y = 0;
         hvec = hvec.normalize();
         if (!hvec.isZero()) {

            hval = Forward.getSignedAngle(hvec) * ToDegrees;
            if (hval < 0) { hval += 360; }
            heading.text(text.heading + hval.toFixed (1));
         }
      }
   }
});


dmz.input.channel.observe(self, TetherChannel, channelState);
dmz.input.channel.observe(self, WatchChannel, channelState);
