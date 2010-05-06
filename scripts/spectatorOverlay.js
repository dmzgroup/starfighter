var dmz =
       { object: require("dmz/components/object")
       , overlay: require("dmz/components/overlay")
       , input: require("dmz/components/input")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , messaging: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , util: require("dmz/types/util")
       }
  , modeOverlay = dmz.overlay.lookup("mode")
  , objOverlay = dmz.overlay.lookup("object")
  , posOverlay = dmz.overlay.lookup("position")
  , oriOverlay = dmz.overlay.lookup("orientation")
  , text =
       { mode: modeOverlay.text()
       , obj: objOverlay.text()
       , pos: posOverlay.text()
       , ori: oriOverlay.text()
       }
//  Constants
  , TetherChannel = dmz.defs.createNamedHandle("tether-portal")
  , WatchChannel = dmz.defs.createNamedHandle("watch-portal")
//  Functions 
  , channelState
  ;


self.shutdown = function () {

  // Reset the text overlays to their original values.
  modeOverlay.text(text.mode);
  objOverlay.text(text.obj);
  posOverlay.text(text.pos);
  oriOverlay.text(text.ori);
};


channelState = function (channel, state) {

   if (state) {

      if (channel === TetherChannel) {

         modeOverlay.text(text.mode + "Free Fly");
      }
      else if (channel === WatchChannel) {

         modeOverlay.text(text.mode + "Watch");
      }
   }
};


dmz.time.setRepeatingTimer (self,  function (time) {

   var hil = dmz.object.hil()
     , pos
     , ori
     , hpr
     ;

   if (hil) {

      pos = dmz.object.position(hil);
      ori = dmz.object.orientation(hil);

      if (pos) {

         posOverlay.text(text.pos +
            pos.x.toFixed() + " " +
            pos.y.toFixed() + " " +
            pos.z.toFixed());
      }

      if (ori) {

         hpr = ori.toEuler();

         hpr[0] = dmz.util.radiansToDegrees(hpr[0]);
         hpr[1] = dmz.util.radiansToDegrees(hpr[1]);
         hpr[2] = dmz.util.radiansToDegrees(hpr[2]);

         oriOverlay.text(text.ori +
            hpr[0].toFixed() + " " +
            hpr[1].toFixed() + " " +
            hpr[2].toFixed());

      }
   }
});


dmz.input.channel.observe(self, TetherChannel, channelState);
dmz.input.channel.observe(self, WatchChannel, channelState);

dmz.messaging.subscribe("Entity_Attach_Message", self,  function (data) {

   objOverlay.text(text.obj + dmz.data.unwrapHandle(data));
});
