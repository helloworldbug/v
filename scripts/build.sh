#!/usr/bin/env bash

SCRIPT_PATH="$( cd "$(dirname "${0}")" ; pwd -P )"
SCRIPT_NAME=`basename "$0"`
ROOT_PATH=$SCRIPT_PATH/..
NODE_MOD_PATH=$ROOT_PATH/node_modules

TASK="release"

function usage {
    echo "Usage: $SCRIPT_NAME release|develop"
    exit 255
}

if [ ! -d "$NODE_MOD_PATH" ]; then
	echo "node_modules not installed. run npm install..."
	cd "$SCRIPT_PATH" && npm install
fi

if [ "$1" != "" ];then
	TASK=$1
fi

if [ "$TASK" != "release" -a "$TASK" != "develop" ]; then
    usage
fi
# update submodule
echo "update submodule start ..."
UPDATE_SUBMODULE_CMD="$SCRIPT_PATH/update_submodule.sh"
echo $UPDATE_SUBMODULE_CMD
bash -c "$UPDATE_SUBMODULE_CMD"
echo "update submodule end"

# build display_engine js files
echo "build display_engine js file start ..."
BUILD_DISPLAY_ENGINE_CMD="$SCRIPT_PATH/build_display_engine.sh $TASK"
echo $BUILD_DISPLAY_ENGINE_CMD
bash -c "$BUILD_DISPLAY_ENGINE_CMD"
echo "build display_engine js file end"



echo "run gulp task $TASK..."
"$NODE_MOD_PATH/gulp/bin/gulp.js" $TASK
RET=$?
echo "run gulp task $TASK end. status = $RET"

exit $RET
