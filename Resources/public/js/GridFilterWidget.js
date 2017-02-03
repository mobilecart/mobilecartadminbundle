/**
 * This widget listens and reacts to an already initialized html structure
 *  It will create a new filter row when you click on the "add filter button"
 *  and remove a filter row when you click the remove filter button"
 *
 * @type {{containerEl: {}, counter: number, ops: {}, fields: {}, initialize: initialize, attachEvents: attachEvents, buildFilter: buildFilter}}
 */


var GridFilterWidget = function(info){
    this.containerEl = info.containerEl;
    this.counter = info.counter;
    this.ops = info.ops;
    this.fields = info.fields;
    this.attachEvents();
    this.renderExisting();
    return this;
};

GridFilterWidget.prototype = {

    containerEl: {},
    counter: 0,
    ops: {},
    fields: {},

    attachEvents: function() {
        var widget = this;

        this.containerEl.delegate('div.filter a.add-filter', 'click', function(e){
            e.preventDefault();
            var self = $(this);
            widget.counter++;
            widget.containerEl.append(widget.buildFilter());
            self.removeClass('add-filter');
            self.addClass('remove-filter');
            var icon = self.find('i.glyphicon');
            icon.removeClass('glyphicon-plus-sign');
            icon.addClass('glyphicon-remove');
        });

        this.containerEl.delegate('div.filter select.adv-filter-field', 'change', function(e){
            e.preventDefault();
            var self = $(this);
            var parent = self.parent();
            var row = parent.parent();
            var inputEl = {};
            var field = self.find(':selected');
            var type = field.attr('data-type');

            // change the available filter operations for the selected data-type
            var filterOps = row.find('select.adv-filter-op');
            filterOps.html('');
            for(var x=0; x < widget.ops.length; x++) {
                var op = widget.ops[x];
                if (op.types.indexOf(type) > -1) {
                    filterOps.append('<option value="' + op.code + '"' + " data-types='{" + '"types":' + JSON.stringify(op.types) + "}'" + '>' + op.label + '</option>');
                }
            }

            // change filter input type as necessary
            var choiceJson = field.attr('data-choices');
            if (!_.isUndefined(choiceJson)) {

                var optionStr = '';
                var choiceContainer = JSON.parse(choiceJson);
                var choices = choiceContainer.choices;
                var choice = '';
                for (var x=0;x<choices.length;x++) {
                    choice = choices[x];
                    optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                }

                // render select input, remove text input if necessary
                inputEl = row.find('select.adv-filter-input');
                if (inputEl.length) {

                    inputEl.html('');
                    inputEl.html(optionStr);

                } else {

                    inputEl = row.find('input.adv-filter-input');
                    for (var x=0;x<choices.length;x++) {
                        choice = choices[x];
                        optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                    }

                    var inputParent = inputEl.parent();
                    inputEl.remove();
                    inputParent.html('<select name="' + inputEl.attr('name') + '" class="form-control adv-filter-input">' + optionStr + '</select>');
                }

            } else {

                // render text input, remove select input if necessary
                inputEl = row.find('input.adv-filter-input');
                if (!inputEl.length) {
                    inputEl = row.find('select.adv-filter-input');
                    if (_.isObject(inputEl)) {
                        var inputParent = inputEl.parent();
                        inputEl.remove();
                        inputParent.html('<input type="text" class="adv-filter-input" name="' + inputEl.attr('name') + '" value="" />');

                    }
                }
            }

        });

        return widget;
    },
    buildFilter: function() {
        var widget = this;

        var html = '<div class="filter row">';
        html += '<div class="col-xs-4">';
        html += '<select name="filter_field[' + widget.counter + ']" class="form-control adv-filter-field">';
        for (i in widget.fields) {
            var field = widget.fields[i];
            html += '<option value="' + field.code+'"';
            if (!_.isUndefined(field.choices)) {
                html += " data-choices='{" + '"choices":' + JSON.stringify(field.choices) + "}'";
            }
            html += ' data-type="' + field.type + '">' + field.label + '</option>';
        }

        html += '</select> ';
        html += '</div>';
        html += '<div class="col-xs-4">';
        html += '<select name="filter_op[' + widget.counter + ']" class="form-control adv-filter-op">';
        for (var x=0; x < widget.ops.length; x++) {
            var op = widget.ops[x];
            html += '<option value="' + op.code + '"' + " data-types='{" + '"types":' + JSON.stringify(op.types) + "}'" + '>'+op.label+'</option>';
        }

        html += '</select> ';
        html += '</div>';
        html += '<div class="col-xs-3">';
        html += '<input type="text" class="adv-filter-input form-control" name="filter_val[' + widget.counter + ']" value="" /> ';
        html += '</div>';
        html += '<div class="col-xs-1">';
        html += '<a href="javascript:;" class="add-filter btn btn-default pull-right" aria-hidden="true"><i class="glyphicon glyphicon-plus-sign"> </i></a>';
        html += '</div>';
        html += '</div>';
        return html;
    },
    renderExisting: function() {
        var widget = this;
        var inputEl = {};

        var fields = widget.containerEl.find('div.filter .adv-filter-field');
        for (var x=0; x<fields.length;x++) {
            var self = $(fields[x]);
            var parent = self.parent();
            var row = parent.parent();

            var field = self.find(':selected');
            var choiceJson = field.attr('data-choices');

            if (!_.isUndefined(choiceJson)) {

                var optionStr = '';
                var choiceContainer = JSON.parse(choiceJson);
                var choices = choiceContainer.choices;
                var choice = '';

                // render select input, remove text input if necessary
                inputEl = row.find('select.adv-filter-input');
                if (inputEl.length) {

                    inputEl.html('');

                    for (var x=0;x<choices.length;x++) {
                        choice = choices[x];
                        optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                    }

                    inputEl.html(optionStr);

                } else {
                    inputEl = row.find('input.adv-filter-input');

                    var value = inputEl.val();
                    for (var x=0;x<choices.length;x++) {
                        choice = choices[x];
                        optionStr += '<option value="' + choice.value + '"';
                        if (value == choice.value) {
                            optionStr += ' selected="selected"';
                        }
                        optionStr += '>' + choice.label + '</option>';
                    }

                    var inputName = inputEl.attr('name');
                    var inputParent = inputEl.parent();
                    inputEl.remove();
                    inputParent.html('<select name="' + inputName + '" class="form-control adv-filter-input">' + optionStr + '</select>');
                }
            }
        }
    }
};
