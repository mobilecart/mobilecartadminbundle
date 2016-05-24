var SlotEditor = function(obj) {
    this.container = obj.container;
    this.insertAction = obj.insertAction;
    this.updateAction = obj.updateAction;
    this.deleteAction = obj.deleteAction;
    this.uploadPostUrl = obj.uploadPostUrl;
    this.imageLoadUrl = obj.imageLoadUrl;
    this.resetSlotSubmit();
    this.attachSlotSubmitEvents();
    this.attachSlotEvents();
    return this;
};

SlotEditor.prototype = {
    container: {},
    postData: {},
    insertAction: '',
    updateAction: '',
    deleteAction: '',
    uploadPostUrl: '',
    imageLoadUrl: '',

    attachSlotEvents: function() {

        var widget = this;

        var panelList = $('.draggable-panel');

        panelList.sortable({
            // Only make the .panel-heading child elements support dragging.
            // Omit this to make then entire <li>...</li> draggable.
            handle: '.panel-heading',
            update: function() {
                $('.panel', panelList).each(function(index, elem) {
                    var $listItem = $(elem),
                        newIndex = $listItem.index();

                    // Persist the new indices.
                });
            }
        });

        widget.container.find('textarea.wysiwyg').each(function(){
            var self = $(this);
            var editor = new Simditor({
                textarea: self,
                toolbar: ['bold', 'italic', 'underline', 'color', '|', 'ol', 'ul', '|']
            });
        });

        widget.container.find('a.slot-trash').click(function(e){
            e.preventDefault();
            var self = $(this);
            var slotId = self.parent().parent().attr('data-id');
            if (slotId > 0) {

                // delete slot and row from html

                var action = widget.deleteAction;
                action = action.replace('1234', slotId);

                var postData = {};
                postData['_method'] = 'DELETE';

                $.ajax({
                    url: action,
                    method: 'POST',
                    data: postData,
                    dataType: 'json'
                }).done(function(response){
                    if (response.success == 1) {
                        widget.container.find('li[data-id="' + slotId + '"]').remove();
                    }
                });

            }
            return false;
        });

        widget.container.find('a.slot-toggle').click(function(e){
            e.preventDefault();
            var self = $(this);
            self.parent().parent().find('div.panel-body').toggle();
            var icon = self.parent().find('i.glyphicon');
            if (icon.hasClass('glyphicon-minus')) {
                icon.removeClass('glyphicon-minus');
                icon.addClass('glyphicon-plus');
            } else {
                icon.removeClass('glyphicon-plus');
                icon.addClass('glyphicon-minus');
            }
        });

        widget.container.find('a.slot-body-toggle').click(function(e){
            e.preventDefault();
            var self = $(this);
            self.parent().parent().find('div.slot-body-container').toggle();
        });

    },
    resetSlotSubmit: function() {
        var html = $('#slot-submit-form-tpl').html();
        $('div.slot-submit-form').html(html);
        return this;
    },
    attachSlotSubmitEvents: function() {
        var widget = this;

        widget.find('.slot-media-drop').each(function(){

            var dropper = $(this);

            var parentEl = dropper.parent();

            var settings = dropper.html5Uploader({

                parent: parentEl,
                postUrl: widget.uploadPostUrl, // add parameters here
                imageUrl: widget.imageLoadUrl,

                /**
                 * File dropped / selected.
                 */
                onDropped: function(success) {
                    var self = this;

                    if (!success) {
                        self.parent.find('.errormessages').text('Only allowed are jpg, png or gif images.');
                    } else {
                        self.parent.find('.errormessages').empty();
                        self.parent.find('.media-drop-placeholder > *').hide();
                        self.parent.find('.media-drop-placeholder').toggleClass('busyloading', true).css('cursor', 'progress');
                    }
                },

                /**
                 * Image cropped and scaled.
                 */
                onProcessed: function(canvas) {
                    var self = this;

                    if (canvas) {

                        // Remove possible previously loaded image.
                        var url = canvas.toDataURL();
                        var newImg = document.createElement("img");
                        newImg.src = url;

                        // Show new image.
                        self.parent.find('.droppedimage').empty().append(newImg);

                        // Hide dropbox.
                        self.parent.find('.dropbox').hide();

                        // Button to reset upload box.
                        self.parent.find('.resetupload').show();

                        // Reset dropbox for reuse.
                        self.parent.find('.errormessages').empty();
                        self.parent.find('.media-drop-placeholder > *').show();
                        self.parent.find('.media-drop-placeholder').toggleClass('busyloading', false).css('cursor', 'auto');
                    }
                },

                /**
                 * Image uploaded.
                 *
                 * @param success boolean True indicates success
                 * @param response Object from parsed JSON
                 */
                onUploaded: function(success, response) {

                    if (success) {

                        if (typeof response.path != 'undefined') {
                            widget.postData['content_slot[path]'] = response.path;
                            //widget.postData['content_slot[id]']
                        }

                        var rowId = response.id;
                        $('button.slot-submit').each(function(){
                            var btn = $(this);
                            btn.attr('data-id', rowId);
                        });

                        modalWidget.setLabel('Success');
                    } else {
                        modalWidget.setLabel('Error');
                    }
                    modalWidget.setBody(response.message);
                    $('#modal-shared').modal('show');
                },

                /**
                 * Progress during upload.
                 *
                 * @param progress Number Progress percentage
                 */
                onUploadProgress: function(progress) {
                    //window.console && console.log('Upload progress: ' + progress);
                }
            });

            // Target image size selection.
            parentEl.find('input[name="targetsize"]').on('change', function() {
                var self = $(this);
                //var val = self.val();
                var width = self.attr('data-width');
                var height = self.attr('data-height');
                //var code = self.attr('data-code');
                settings.cropRatio = width / height;
                //$('#dropbox').css('width', width + 'px').css('height', height + 'px');
            });

            //
            parentEl.find('.resetupload').hide().on('click', function(){
                var self = $(this);
                parentEl.find('.droppedimage').empty();
                parentEl.find('.dropbox').show();
                self.hide();
            });

        });

        widget.container.find('button.slot-submit').click(function(e){
            var self = $(this);
            self.hide();
            self.parent().find('.spinner').show();

            var submitDiv = $('div.slot-submit-form');
            var postData = widget.postData;

            submitDiv.find('input, textarea').each(function(){
                var input = $(this);

                switch(input.attr('name')) {
                    case 'content_slot[path]':
                        // no-op
                        break;
                    case 'content_slot[content_type]':
                        if (typeof postData.content_type == 'undefined') {
                            input = submitDiv.find('input[name="content_slot[content_type]"]');
                            postData[input.attr('name')] = input.val();
                        }
                        break;
                    default:
                        postData[input.attr('name')] = input.val();
                        break;
                }

            });

            var action = widget.insertAction; // insert
            var rowId = self.attr('data-id');
            if (typeof rowId != 'undefined') {
                // Note : We cannot generate a link before we have an ID , so we do a string replace
                action = widget.updateAction; // update
                action = action.replace('1234', rowId);
                postData['_method'] = 'PUT';
            }

            var parentId = self.attr('data-parent-id');
            if (typeof parentId != 'undefined') {
                postData['content_slot[parent_id]'] = parentId;
            }

            // post
            $.ajax({
                url: action,
                method: 'POST',
                dataType: 'json',
                data: postData
            }).done(function(response){

                if (response.success == 1) {

                    widget.postData = {};

                    // add the new slot to the list of current slots, and attach events
                    widget.addSlot(response.entity);

                    // reset slot submit area
                    widget.resetSlotSubmit();
                    widget.attachSlotSubmitEvents();
                }
            });

            return false;
        });

        widget.container.find('input[name="content_slot[content_type]"]').change(function(){
            var self = $(this);
            var elClass = 'slot-' + self.val();
            $('div.slot-type').hide();
            $('div.' + elClass).show();
            return true;
        });
    },
    addSlot: function(slot) {
        var widget = this;

        var panelList = $('.draggable-panel');
        var tplEl = $('#slot-li');
        var tpl = _.template(tplEl.html());
        panelList.prepend(tpl(slot));
        var li = panelList.find('li[data-id="' + slot.id + '"]');

        // reset minimize/maximize button
        panelList.sortable({
            // Only make the .panel-heading child elements support dragging.
            // Omit this to make then entire <li>...</li> draggable.
            handle: '.panel-heading',
            update: function() {
                $('.panel', panelList).each(function(index, elem) {
                    var $listItem = $(elem),
                        newIndex = $listItem.index();

                    // Persist the new indices.
                });
            }
        });

        // reset simditor
        li.find('textarea.wysiwyg').each(function(){
            var self = $(this);
            var editor = new Simditor({
                textarea: self,
                toolbar: ['bold', 'italic', 'underline', 'color', '|', 'ol', 'ul', '|']
            });
        });

        // reset show/hide link
        li.find('a.slot-toggle').click(function(e){
            e.preventDefault();
            var self = $(this);
            self.parent().parent().find('div.panel-body').toggle();
            var icon = self.parent().find('i.glyphicon');
            if (icon.hasClass('glyphicon-minus')) {
                icon.removeClass('glyphicon-minus');
                icon.addClass('glyphicon-plus');
            } else {
                icon.removeClass('glyphicon-plus');
                icon.addClass('glyphicon-minus');
            }
        });

        li.find('a.slot-body-toggle').click(function(e){
            e.preventDefault();
            var self = $(this);
            self.parent().parent().find('div.slot-body-container').toggle();
        });

        // reset remove link
        li.find('a.slot-trash').click(function(e){
            e.preventDefault();
            var self = $(this);
            var slotId = self.parent().parent().attr('data-id');
            if (slotId > 0) {

                // delete slot and row from html

                var action = widget.deleteAction;
                action = action.replace('1234', slotId);

                var postData = {};
                postData['_method'] = 'DELETE';

                $.ajax({
                    url: action,
                    method: 'POST',
                    data: postData,
                    dataType: 'json'
                }).done(function(response){
                    if (response.success == 1) {
                        widget.container.find('li[data-id="' + slotId + '"]').remove();
                    }
                });

            }
            return false;
        });

        return this;
    }
};
