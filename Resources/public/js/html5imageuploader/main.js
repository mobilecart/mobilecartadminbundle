// http://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
$(function() {

    var settings = $('.media-drop').html5Uploader({

        postUrl: uploadUrl, // add parameters here
        imageUrl: retrieveUrl,

        /**
         * File dropped / selected.
         */
        onDropped: function(success) {
            if (!success) {
                $('.errormessages').text('Only allowed are jpg, png or gif images.');
            } else {

                var sizeInput = $('input[name="targetsize"]');
                var code = sizeInput.attr('data-code');
                settings.postUrl = baseUploadUrl + '&image_code=' + code;

                $('.errormessages').empty();
                $('.media-drop-placeholder > *').hide();
                $('.media-drop-placeholder').toggleClass('busyloading', true).css('cursor', 'progress');
            }
        },

        /**
         * Image cropped and scaled.
         */
        onProcessed: function(canvas) {
            if (canvas) {

                // Remove possible previously loaded image.
                var url = canvas.toDataURL();
                var newImg = document.createElement("img");
                newImg.src = url;

                // Show new image.
                $('#droppedimage').empty().append(newImg);

                // Hide dropbox.
                $('#dropbox').hide();

                // Button to reset upload box.
                $('#resetupload').show();

                // Reset dropbox for reuse.
                $('.errormessages').empty();
                $('.media-drop-placeholder > *').show();
                $('.media-drop-placeholder').toggleClass('busyloading', false).css('cursor', 'auto');

            } else {

                // Todo: toon nette foutmelding.
                window.alert("Bestand wordt niet herkend als afbeelding, probeert u het opnieuw met een ander bestand.")
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
                // add to list in list tab
                imageTable.add(response);
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
    $('input[name="targetsize"]').on('change', function() {
        var self = $(this);
        //var val = self.val();
        var width = self.attr('data-width');
        var height = self.attr('data-height');
        //var code = self.attr('data-code');
        settings.cropRatio = width / height;
        //$('#dropbox').css('width', width + 'px').css('height', height + 'px');
    });

    //
    $('#resetupload').hide().on('click', function(){
        var self = $(this);
        $('#droppedimage').empty();
        $('#dropbox').show();
        self.hide();
    });

    // add listeners to listing tab
    //  delete row
    //  rebuild hidden input
    // wrap hidden input(s)
    $('button#form-submit').on('click', function(e){
        imageTable.serialize();
    });

});
