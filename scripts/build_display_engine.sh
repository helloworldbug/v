#!/usr/bin/env bash

SCRIPT_PATH="$( cd "$(dirname "${0}")" ; pwd -P )"
DISPLAY_ENGINE_PATH=$SCRIPT_PATH/../js/lib/display_engine

TASK="release"

function usage {
    echo "Usage: $SCRIPT_NAME release|develop"
    exit 255
}

if [ "$1" != "" ];then
	TASK=$1
fi

if [ "$TASK" != "release" -a "$TASK" != "develop" ]; then
    usage
fi

echo "build display_engine mode: $TASK..."
echo $DISPLAY_ENGINE_PATH
cd $DISPLAY_ENGINE_PATH && npm run "$TASK"
RET=$?
echo "build display_engine node: $TASK end. status = $RET"

RENDER_JS_SRC_FILE=$DISPLAY_ENGINE_PATH/dist/$TASK/dist/js/render.js
RENDER_JS_DEST_FILE=$DISPLAY_ENGINE_PATH/../render.js
RENDER_SCSS_SRC_FILE=$DISPLAY_ENGINE_PATH/dist/$TASK/dist/css/main.scss
RENDER_SCSS_DEST_FILE=$DISPLAY_ENGINE_PATH/../../../css/main.scss
echo "copy render.js: $RENDER_JS_SRC_FILE => $RENDER_JS_DEST_FILE"
cp $RENDER_JS_SRC_FILE $RENDER_JS_DEST_FILE
echo "copy main.scss: $RENDER_SCSS_SRC_FILE => $RENDER_SCSS_DEST_FILE"
cp $RENDER_SCSS_SRC_FILE $RENDER_SCSS_DEST_FILE
RET=$?
echo "copy render.js end. status = $RET"

exit $RET
