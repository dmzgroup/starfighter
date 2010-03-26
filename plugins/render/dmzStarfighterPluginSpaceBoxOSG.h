#ifndef DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H
#define DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H

#include <dmzRuntimeLog.h>
#include <dmzRuntimePlugin.h>
#include <dmzRuntimeResources.h>

namespace dmz {

   class RenderModuleCoreOSG;

   class StarfighterPluginSpaceBoxOSG :
         public Plugin {

      public:
         StarfighterPluginSpaceBoxOSG (const PluginInfo &Info, Config &local);
         ~StarfighterPluginSpaceBoxOSG ();

         // Plugin Interface
         virtual void update_plugin_state (
            const PluginStateEnum State,
            const UInt32 Level);

         virtual void discover_plugin (
            const PluginDiscoverEnum Mode,
            const Plugin *PluginPtr);

      protected:
         void _create_box ();
         void _init (Config &local);

         Log _log;
         Resources _rc;

         String _imgRc;
         Float64 _offset;
         RenderModuleCoreOSG *_core;

      private:
         StarfighterPluginSpaceBoxOSG ();
         StarfighterPluginSpaceBoxOSG (const StarfighterPluginSpaceBoxOSG &);
         StarfighterPluginSpaceBoxOSG &operator= (const StarfighterPluginSpaceBoxOSG &);

   };
};

#endif // DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H
