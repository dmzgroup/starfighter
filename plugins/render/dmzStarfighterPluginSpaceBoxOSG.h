#ifndef DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H
#define DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H

#include <dmzObjectObserverUtil.h>
#include <dmzRuntimeLog.h>
#include <dmzRuntimePlugin.h>
#include <dmzRuntimeResources.h>
#include <dmzRuntimeTimeSlice.h>

#include <osg/MatrixTransform>

namespace dmz {

   class RenderModuleCoreOSG;

   class StarfighterPluginSpaceBoxOSG :
         public Plugin,
         public TimeSlice,
         public ObjectObserverUtil {

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

         // TimeSlice Interface
         virtual void update_time_slice (const Float64 DeltaTime);

         // ObjectObserverUtil Interface
         virtual void update_object_flag (
            const UUID &Identity,
            const Handle ObjectHandle,
            const Handle AttributeHandle,
            const Boolean Value,
            const Boolean *PreviousValue);

      protected:
         void _create_box ();
         void _add_box ();
         void _remove_box ();
         void _init (Config &local);

         Log _log;
         Resources _rc;

         Handle _defaultHandle;
         Handle _hil;

         String _imgRc;
         Float64 _offset;
         RenderModuleCoreOSG *_core;

         osg::ref_ptr<osg::MatrixTransform> _box;

      private:
         StarfighterPluginSpaceBoxOSG ();
         StarfighterPluginSpaceBoxOSG (const StarfighterPluginSpaceBoxOSG &);
         StarfighterPluginSpaceBoxOSG &operator= (const StarfighterPluginSpaceBoxOSG &);

   };
};

#endif // DMZ_STARFIGHTER_PLUGIN_SPACE_BOX_OSG_DOT_H
