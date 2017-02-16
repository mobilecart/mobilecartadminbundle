var ImageTable = function(info) {
    this.bodyEl = info.bodyEl;
}

ImageTable.prototype = {
    add: function(obj) {
        this.bodyEl.append(this.buildRow(obj));
    },
    buildRow: function(obj) {
        var html = '';

        html += '<tr data-id="' + obj.id + '">' +
            '<td><a target="_blank" href="/'+ obj.relative_path +'">View</a></td>' +
            '<td>' + obj.width + ' x ' + obj.height + '</td>' +
            '<td>' + obj.code + '</td>' +
            '<td><input type="number" class="image-sort-order" value="1" /></td>' +
            '<td><input type="checkbox" class="image-is-default" value="1" /></td>' +
            '<td><textarea class="form-control image-alt-text"></textarea></td>' +
            '<td><a href="#" class="btn btn-default image-remove-btn"><i class="glyphicon glyphicon-remove"> </i></a></td>' +
            '</tr>';

        return html;
    },
    serialize: function() {

        //rebuild json string before submitting form
        var images = [];

        this.bodyEl.find('tr').each(function(){
            var self = $(this);

            var id = self.attr('data-id');
            var sortOrder = self.find('input.image-sort-order').val();
            var isDefault = self.find('input.image-is-default').is(':checked');
            var altText = self.find('textarea.image-alt-text').val();

            var image = {
                id: id,
                sort_order: sortOrder,
                is_default: isDefault,
                alt_text: altText
            };

            images.push(image);
        });

        $('input#images_json').val(JSON.stringify(images));
    }
};
