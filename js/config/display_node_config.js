var display_node = {
    //尾页节点
    EndNode:
        '<div id="end-node-wrapper" data-type="stage" me-lp="yes"><div class="end-node-face">' +
        '<img id="end-node-face" src="author_img" data-author-id="author_id" /></div>' +
        '<div id="end-node-nick" class="end-node-nick">author_name</div>' +
        '<div id="end-node-guanzhu" class="end-node-guanzhu" data-guanzhu="guanzhu_id"></div>' +
        '<div class="end-node-btn button_background" ><div id="end-node-btn" data-type="data_type"></div></div></div>',
    CommentMask:'<div class="commentMaskLayer">'+
        '</div>'
}

module.exports = display_node;