#ifndef DMZ_STARFIGHTER_PLUGIN_LAUNCH_TUBE_OSG_DOT_H
#define DMZ_STARFIGHTER_PLUGIN_LAUNCH_TUBE_OSG_DOT_H

#include <dmzObjectObserverUtil.h>
#include <dmzRuntimeLog.h>
#include <dmzRuntimePlugin.h>
#include <dmzRuntimeResources.h>
#include <dmzRuntimeTimeSlice.h>

#include <osg/MatrixTransform>
#include <osg/Switch>

namespace dmz {

   class RenderModuleCoreOSG;

   class StarfighterPluginLaunchTubeOSG :
         public Plugin,
         public TimeSlice,
         public ObjectObserverUtil {

      public:
         StarfighterPluginLaunchTubeOSG (const PluginInfo &Info, Config &local);
         ~StarfighterPluginLaunchTubeOSG ();

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

         virtual void update_object_counter (
            const UUID &Identity,
            const Handle ObjectHandle,
            const Handle AttributeHandle,
            const Int64 Value,
            const Int64 *PreviousValue);

      protected:
         void _create_tube ();
         void _add_tube ();
         void _remove_tube ();
         void _init (Config &local);

         Log _log;
         Resources _rc;

         Handle _defaultHandle;
         Handle _autopilotHandle;
         Handle _hil;

         String _imgRc;
         Float64 _offset;
         RenderModuleCoreOSG *_core;

         osg::ref_ptr<osg::MatrixTransform> _tube;
         osg::ref_ptr<osg::Switch> _toggle;

      private:
         StarfighterPluginLaunchTubeOSG ();
         StarfighterPluginLaunchTubeOSG (const StarfighterPluginLaunchTubeOSG &);
         StarfighterPluginLaunchTubeOSG &operator= (
            const StarfighterPluginLaunchTubeOSG &);
   };
};

#endif // DMZ_STARFIGHTER_PLUGIN_LAUNCH_TUBE_OSG_DOT_H
