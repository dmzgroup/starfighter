var dmz = {}
,   Bars
,   cannonBars
,   engineBars
,   shieldBars
;

dmz.object= require("dmz/components/object");
dmz.input = require("dmz/components/input");
dmz.overlay = require("dmz/components/overlay");
dmz.time = require("dmz/runtime/time");
dmz.vector = require("dmz/types/vector");
dmz.matrix = require("dmz/types/matrix");
dmz.mask = require("dmz/types/mask");
dmz.defs = require("dmz/runtime/definitions");
dmz.util = require("dmz/types/util");

Bars = function (name, root) {

   var ix;

   this.overlay = dmz.overlay.lookup(name);

   if (this.overlay) {

      this.bars = new Array(10);

      for (ix = 0; ix < 10; ix++) {

         this.bars[ix] = this.overlay.lookup(root + ix.toString ());

         if (!this.bars[ix]) {

            throw util.createError(
               "Unable to find sub overlay node: " + root + ix.toString () +
                  " in node: " + name);
         }
      }

      this.red = dmz.overlay.color("bar-red");

      if (!this.red) { throw util.createError("Unable to find color bar-red"); }

      this.yellow = dmz.overlay.color("bar-yellow");

      if (!this.yellow) { throw util.createError("Unable to find color bar-yellow"); }

      this.green = dmz.overlay.color("bar-green");

      if (!this.green) { throw util.createError("Unable to find color bar-green"); }

      this.clear = dmz.overlay.color("bar-clear");

      if (!this.clear) { throw util.createError("Unable to find color bar-clear"); }
   }
   else { throw util.createError("Unable to find overlay node: " + name); }
};

exports.create = function (name, root) {

   if (!root) { root = "bar-"; }

   return new Bars (name, root);
};


Bars.prototype.update = function (level) {

   var color = this.green
   ,   ix
   ;

   if (level < 3) { color = this.red; }
   else if (level < 6) { color = this.yellow; }

   for (ix = 0; ix < 10; ix++) {

      if (ix < level) { this.bars[ix].color(color); }
      else { this.bars[ix].color(this.clear); }
   }
};
