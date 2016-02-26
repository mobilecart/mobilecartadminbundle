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
            self.removeClass('glyphicon-plus-sign');
            self.addClass('glyphicon-remove-sign');
        });

        this.containerEl.delegate('div.filter a.remove-filter', 'click', function(e){
            e.preventDefault();
            var self = $(this);
            self.parent().remove();
        });

        this.containerEl.delegate('div.filter select.adv-filter-field', 'change', function(e){
            e.preventDefault();
            var self = $(this);
            var inputEl = {};
            var field = self.find(':selected');
            var type = field.attr('data-type');

            // change the available filter operations for the selected data-type
            var filterOps = self.parent().find('select.adv-filter-op'); // todo : use sibling here
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
                // render select input, remove text input if necessary
                inputEl = self.parent().find('select.adv-filter-input');
                if (inputEl.length) {

                    inputEl.html('');
                    var optionStr = '';
                    var choiceContainer = JSON.parse(choiceJson);
                    var choices = choiceContainer.choices;
                    for (var x=0;x<choices.length;x++) {
                        var choice = choices[x];
                        optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                    }

                    inputEl.html(optionStr);

                } else {
                    inputEl = self.parent().find('input.adv-filter-input');
                    if (_.isObject(inputEl)) {

                        var optionStr = '';
                        var choiceContainer = JSON.parse(choiceJson);
                        var choices = choiceContainer.choices;
                        for (var x=0;x<choices.length;x++) {
                            var choice = choices[x];
                            optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                        }

                        var inputName = inputEl.attr('name');
                        $('<select name="' + inputName + '" class="adv-filter-input">' + optionStr + '</select>').insertAfter(inputEl);
                        inputEl.remove();
                    }
                }

            } else {
                // render text input, remove select input if necessary
                inputEl = self.parent().find('input.adv-filter-input');
                if (!inputEl.length) {
                    inputEl = self.parent().find('select.adv-filter-input');
                    if (_.isObject(inputEl)) {
                        var inputName = inputEl.attr('name');
                        $('<input type="text" class="adv-filter-input" name="' + inputName + '" value="" />').insertAfter(inputEl);
                        inputEl.remove();
                    }
                }
            }

        });

        return widget;
    },
    buildFilter: function() {
        var widget = this;

        var html = '<div class="filter">';
        html += '<label>Filter</label> ';
        html += '<select name="filter_field[' + widget.counter + ']" class="adv-filter-field">';
        for (i in widget.fields) {
            var field = widget.fields[i];
            html += '<option value="' + field.code+'"';
            if (!_.isUndefined(field.choices)) {
                html += " data-choices='{" + '"choices":' + JSON.stringify(field.choices) + "}'";
            }
            html += ' data-type="' + field.type + '">' + field.label + '</option>';
        }

        html += '</select> ';
        html += '<select name="filter_op[' + widget.counter + ']" class="adv-filter-op">';
        for (var x=0; x < widget.ops.length; x++) {
            var op = widget.ops[x];
            html += '<option value="' + op.code + '"' + " data-types='{" + '"types":' + JSON.stringify(op.types) + "}'" + '>'+op.label+'</option>';
        }

        html += '</select> ';
        html += '<input type="text" class="adv-filter-input" name="filter_val[' + widget.counter + ']" value="" /> ';
        html += '<a href="javascript:;" class="add-filter glyphicon glyphicon-plus-sign" aria-hidden="true">&nbsp;</a>';
        html += '</div>';
        return html;
    },
    renderExisting: function() {
        var widget = this;

        var fields = widget.containerEl.find('div.filter .adv-filter-field');
        for (var x=0; x<fields.length;x++) {
            var self = $(fields[x]);
            var field = self.find(':selected');
            var choiceJson = field.attr('data-choices');

            if (!_.isUndefined(choiceJson)) {
                // render select input, remove text input if necessary
                var inputEl = self.parent().find('select.adv-filter-input');
                if (inputEl.length) {

                    inputEl.html('');
                    var optionStr = '';
                    var choiceContainer = JSON.parse(choiceJson);
                    var choices = choiceContainer.choices;
                    for (var x=0;x<choices.length;x++) {
                        var choice = choices[x];
                        optionStr += '<option value="' + choice.value + '">' + choice.label + '</option>';
                    }

                    inputEl.html(optionStr);

                } else {
                    var inputEl = self.parent().find('input.adv-filter-input');
                    if (_.isObject(inputEl)) {

                        var value = inputEl.val();

                        var optionStr = '';
                        var choiceContainer = JSON.parse(choiceJson);
                        var choices = choiceContainer.choices;
                        for (var x=0;x<choices.length;x++) {
                            var choice = choices[x];
                            optionStr += '<option value="' + choice.value + '"';
                            if (value == choice.value) {
                                optionStr += ' selected="selected"';
                            }
                            optionStr += '>' + choice.label + '</option>';
                        }

                        var inputName = inputEl.attr('name');
                        $('<select name="' + inputName + '" class="adv-filter-input">' + optionStr + '</select>').insertAfter(inputEl);
                        inputEl.remove();
                    }
                }

            }
        }
    }
};
