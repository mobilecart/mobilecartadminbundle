var SlotTable = function(info) {
    this.bodyEl = info.bodyEl;
}

SlotTable.prototype = {

    slots: [],
    findSlotById: function(id) {
        var self = this;
        for (var x = 0; x < self.slots.length; x++) {
            var slot = self.slots[x];
            if (typeof slot.id != 'undefined' && slot.id == id) {
                return slot;
            }
        }

        return false;
    },
    add: function(obj) {
        this.bodyEl.append(this.buildRow(obj));
        this.slots.push(obj);
        return this;
    },
    buildRow: function(obj) {
        var html = '';

        /*
        <tr data-id="{{ slot.id }}">
            <td><input type="checkbox" /></td>
            <td><input type="number" class="slot-sort-order" value="{{ slot.sortorder }}" /></td>
            <td><input type="text" value="{{ slot.title }}" /></td>
            <td>{{ slot.contenttype }}</td>
        </tr>

        //*/

        html += '<tr data-id="' + obj.id + '">' +
            '<td><input type="checkbox" /></td>' +
            '<td><input type="number" class="slot-sort-order" value="1" /></td>' +
            '<td>' + obj.title + '</td>' +
            '<td>' + obj.content_type + '</td>' +
            '</tr>';

        return html;
    },
    serialize: function() {
        $('input#slots_json').val(JSON.stringify(this.slots));
    }
};
