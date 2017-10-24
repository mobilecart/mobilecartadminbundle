
var ConditionWidget = function(info) {
    //init parameters
    this.containerEl = info.containerEl;
    this.operators = info.operators;
    this.logicalOperators = info.logicalOperators;
    if (typeof info.targetLogicalOperators != 'undefined') {
        this.targetLogicalOperators = info.targetLogicalOperators;
    }
    this.containerOperators = info.containerOperators;
    this.varSets = info.varSets;
    this.conditionInput = info.conditionInput;

    var targetCompareObj = {};
    if (typeof info.targetInput != 'undefined') {
        this.targetInput = info.targetInput;

        this.targetInput.hide();

        try {
            targetCompareObj = JSON.parse(this.targetInput.val());
        } catch(e) {
            targetCompareObj = {};
        }
    }

    //hide widget inputs
    this.conditionInput.hide();

    //insert needed markup around the inputs being wrapped
    this.insertBaseMarkup();

    var preCompareObj = {};
    try {
        preCompareObj = JSON.parse(this.conditionInput.val());
    } catch(e) {
        preCompareObj = {};
    }

    this.populateConditionsWidget(preCompareObj, targetCompareObj);
    this.attachEvents();

    return this;
};

ConditionWidget.prototype = {

    containerEl: {},
    operators: {},
    containerOperators: {},
    logicalOperators: {},
    targetLogicalOperators: null,
    varSets: {},
    currentVarSet: {},
    conditionInput: {},
    //targetInput: null,

    insertBaseMarkup: function() {
        this.conditionInput.parent().append('<ul class="builder"><li class="condition-compare root conditions"></li></ul>');
        if (typeof this.targetInput != 'undefined') {
            this.targetInput.parent().append('<ul class="builder"><li class="condition-compare root actions"></li></ul>');
        }
        return this;
    },

    attachEvents: function() {
        var me = this;
        var cEl = this.containerEl;

        // serialize after all select inputs change
        cEl.delegate('select', 'change', function(e){
            me.serialize();
        });

        // serialize after all text inputs are changed
        cEl.delegate('input', 'keyup', function(e){
            me.serialize();
        });

        // create new row in UI, populate with defaults
        cEl.delegate('a.add-condition', 'click', function(e) {

            e.preventDefault();
            var self = $(this);
            var parent = self.parent();
            var parent3 = parent.parent().parent();
            var entityType = parent3.find('div.condition-comparison select.compare-operator').val();

            var vars = me.varSets[entityType]['vars'];
            var field = '';
            var datatype = '';
            var isDropdown = false;
            var dropdownOptions = [];
            for(key in vars) {
                var aVar = vars[key];

                if (!_.isUndefined(aVar.datatype)) {
                    datatype = aVar.datatype;
                }

                if (!_.isUndefined(aVar.options)) {
                    dropdownOptions = aVar.options;
                    isDropdown = true;
                }
                field = key;
                break;
            }

            var depth = self.attr('data-depth');
            if (_.isUndefined(depth)) {
                depth = 1;
            }

            var liEl = false;
            if (parent3.hasClass('root')) {
                depth = 1;
            } else {
                var selectEl = parent3.find('div.condition-comparison select.compare-operator');
                liEl = selectEl.parent();
            }

            if (!parent.hasClass('condition')) {
                parent.addClass('condition');
            }
            var condition = me.createConditionObject();
            condition.entity_type = entityType;
            condition.entity_field = field;

            parent.html(me.buildCondition(condition, liEl));
            parent.parent().append('<li>' + me.buildAddLinks(depth) + '</li>');

            me.serialize();
        });

        cEl.delegate('a.add-compare', 'click', function(e) {
            e.preventDefault();
            var self = $(this);

            var depth = self.attr('data-depth');
            if (typeof depth == 'undefined') {
                depth = 1;
            }

            var parent = self.parent();

            if (!parent.hasClass('condition-compare')) {
                parent.addClass('condition-compare');
            }

            var compareHtml = me.buildCompareControl(parent);
            var newDepth = depth + 1;
            compareHtml += me.buildConditionsContainer(true, newDepth);

            parent.html(compareHtml);
            parent.parent().append('<li>' + me.buildAddLinks(depth) + '</li>');

            me.serialize();
        });

        cEl.delegate('select.entity-field', 'change', function(e) {
            e.preventDefault();
            var self = $(this);
            var fieldEl = self.find(':selected');
            var datatype = fieldEl.attr('data-type');
            var conditionEl = self.parent().find('select.condition-operator');
            var valueEl = self.parent().find('.condition-value'); // input or select element
            valueEl.remove();

            var field = fieldEl.val();
            var entityType = self.parent().attr('data-entity-type');
            var fields = me.varSets[entityType]['vars'];

            if (_.isUndefined(fields[field]['options'])) {
                conditionEl.html(me.buildSelectOperatorOptions(datatype, ''));
                self.parent().append(me.buildText('condition-value', ''));
                return true;
            }

            conditionEl.html(me.buildSelectEqualsOperatorOptions());
            var options = fields[field]['options'];
            self.parent().append(me.buildSelectOptions(options, 'condition-value', ''));

            return true;
        });

        cEl.delegate('a.condition-remove', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            self.parent().parent().remove();
            me.serialize();
        });

        cEl.delegate('a.compare-remove', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            var el = self.parent().parent().parent();
            if (!el.hasClass('root')) {
                el.remove();
            }
            me.serialize();
        });

        // change fields options when changing entity type
        cEl.delegate('select.entity-type', 'change', function(e) {
            var self = $(this);
            var el = self.parent().find('select.entity-field');
            el.html(me.buildEntityTypeOptions(self.val()));
        });
    },

    buildSelectOperatorOptions: function(datatype, selected) {
        var self = this;

        // get options
        var select = '';
        var values = self.operators;
        for (value in values) {
            var obj = values[value];
            if (obj.types.indexOf(datatype) > -1) {
                var label = obj.label;
                var typesJson = JSON.stringify(obj.types);
                select += '<option value="' + value + '"';
                select += " data-types='" + '{"types":' + typesJson + "}'";
                if (value == selected) {
                    select += ' selected="selected"';
                }
                select += '>' + label + '</option>';

            }
        }
        return select;
    },

    // select options which only contain the equals operator
    //  used when the compare_value input is a select, and not a text input
    buildSelectEqualsOperatorOptions: function() {
        var self = this;

        // get options
        var select = '';
        var values = self.operators;
        for (value in values) {

            if (value != 'equals') {
                continue;
            }

            var obj = values[value];
            var label = obj.label;
            var typesJson = JSON.stringify(obj.types);
            select += '<option value="' + value + '"';
            select += " data-types='" + '{"types":' + typesJson + "}'";
            select += ' selected="selected"';
            select += '>' + label + '</option>';
        }
        return select;
    },

    buildEntityTypeOptions: function(entity_type) {
        var options = '';
        var vars = this.varSets[entity_type]['vars'];
        for(option in vars) {
            var info = vars[option];
            options += '<option data-entity-type="' + entity_type + '" value="' + option + '">' + info['name'] + '</option>';
        }
        return options;
    },

    buildSelectEntityTypes: function(types, value, hideOthers) {
        var select = '<select class="entity-type">';
        for(type in types) {

            if (
                typeof hideOthers != 'undefined'
                && hideOthers == true
                && type != value
            ) {
                continue;
            }

            var name = types[type]['name'];
            select += '<option value="' + type + '"';
            if (type == value) {
                select += ' selected="selected"';
            }
            select += '>' + name + '</option>';
        }
        select += '</select>';
        return select;
    },

    buildSelectEntityFields: function(fields, value) {
        var select = '<select class="entity-field">';
        for(field in fields) {

            select += '<option value="' + field + '"';
            if (field == value) {
                select += ' selected="selected"';
            }
            select += ' data-type="' + fields[field]['datatype'] + '"';
            select += '>' + fields[field]['name'] + '</option>';
        }
        select += '</select>';
        return select;
    },

    buildSelectOperators: function (values, selected, datatype) {

        var select = '<select class="condition-operator">';
        for(value in values) {
            var obj = values[value];
            var label = obj.label;
            var typesJson = JSON.stringify(obj.types);

            if (typeof datatype != 'undefined' && datatype != null && obj.types.indexOf(datatype) < 0) {
                continue;
            }

            select += '<option value="' + value + '"';
            select += " data-types='" + '{"types":' + typesJson + "}'";
            if (value == selected) {
                select += ' selected="selected"';
            }
            select += '>' + label + '</option>';
        }
        select += '</select>';
        return select;
    },

    buildSelectOptions: function (values, className, selected) {
        var select = '<select class="' + className + '">';
        for(value in values) {
            var label = values[value];
            select += '<option value="' + label + '"';
            if (value == selected) {
                select += ' selected="selected"';
            }
            select += '>' + label + '</option>';
        }
        select += '</select>';
        return select;
    },

    buildSelectGeneric: function (values, className, selected) {
        var select = '<select class="' + className + '">';
        for(value in values) {
            var label = values[value];
            select += '<option value="' + value + '"';
            if (value == selected) {
                select += ' selected="selected"';
            }
            select += '>' + label + '</option>';
        }
        select += '</select>';
        return select;
    },

    buildText: function (className, value) {
        return '<input class="' + className + '" type="text" value="' + value + '" />';
    },

    buildAddLinks: function(depth) {

        if (_.isUndefined(depth)) {
            depth = 1;
        }

        var html = '';
        if (depth == 1) {
            html += '<a class="add-compare btn btn-default" data-depth="' + depth + '" href="#">Add Criteria</a>';
        } else {
            html = '<a class="add-condition btn btn-default" data-depth="' + depth + '" href="#">Add Criteria</a>';
        }

        return html;
    },

    // build row of controls
    buildCondition: function(condition, liEl) {

        // ensure entity_type is valid, and following the intended widget behavior
        //  which is to only allow product|customer|shipment at the 2nd level

        if (_.isUndefined(condition.entity_type)) {
            condition.entity_type = '';
            condition.entity_field = '';
        }

        // todo : factor this out when I have time
        if (condition.entity_type.length == 0 && !_.isUndefined(liEl)) {
            var compareEl = liEl.find('select.compare-operator');
            if (typeof compareEl.val() != 'undefined') {
                var selectVal = compareEl.val();
                if (selectVal.length > 1 && selectVal != 'and' && selectVal != 'or') {
                    condition.entity_type = selectVal;
                }
            }
        }

        var vars = this.varSets[condition.entity_type]['vars'];
        var datatype = null;
        var isDropdown = false;
        var dropdownOptions = [];
        var aVar = {};

        // todo : factor this out when I have time
        if (condition.entity_field.length > 0) {
            aVar = vars[condition.entity_field];
            if (!_.isUndefined(aVar) && !_.isUndefined(aVar.options)) {
                dropdownOptions = aVar.options;
                isDropdown = true;
            }
            if (!_.isUndefined(aVar.datatype)) {
                datatype = aVar.datatype;
            }
        } else {
            for(key in vars) {
                aVar = vars[key];

                if (!_.isUndefined(aVar.datatype)) {
                    datatype = aVar.datatype;
                }

                if (!_.isUndefined(aVar.options)) {
                    dropdownOptions = aVar.options;
                    isDropdown = true;
                }
                break;
            }
        }

        var html = '<div data-entity-type="' + condition.entity_type + '">';
        html += '<a class="condition-remove" href="#">x</a>&nbsp;';
        html += this.buildSelectEntityFields(vars, condition.entity_field) + ' : ';

        if (isDropdown) {
            html += '<select class="condition-operator">' + this.buildSelectEqualsOperatorOptions() + '</select>';
            html += ' : ' + this.buildSelectOptions(dropdownOptions, 'condition-value', '');
        } else {
            html += this.buildSelectOperators(this.operators, condition.operator, datatype);
            html += ' : ' + this.buildText('condition-value', condition.compare_value);
        }

        html += '</div>';
        return html;
    },

    buildCompareControl: function(el, compareObj, isTarget) {
        // el should be a li element
        var self = this;
        var html = '<div class="condition-comparison">';
        var addRemoveLink = !el.hasClass('root'); // parent of link element
        var parent3 = $(el).parent().parent(); // great-grandparent of link element
        var enableContainerOps = parent3.hasClass('root');// || el.hasClass('root');
        var operator = '';
        if (!_.isUndefined(compareObj) && !_.isUndefined(compareObj.operator)) {
            operator = compareObj.operator;
        }

        html += '<div>';
        if (addRemoveLink === true) {
            html += '<a class="compare-remove" href="#">x</a>&nbsp;';
        }

        if (enableContainerOps && typeof self.containerOperators != 'undefined') {
            html += this.buildSelectGeneric(self.containerOperators, 'compare-operator', operator);
        } else {
            if (isTarget && self.targetLogicalOperators != null) {
                html += this.buildSelectGeneric(self.targetLogicalOperators, 'compare-operator', operator);
            } else {
                html += this.buildSelectGeneric(self.logicalOperators, 'compare-operator', operator);
            }
        }

        html += '</div>';
        html += '</div>';

        return html;
    },

    buildConditionsContainer: function(addLinks, depth) {
        var html = '<ul class="compare-conditions">';

        if (_.isUndefined(depth)) {
            depth = 1;
        }

        if (addLinks) {
            html += '<li>' + this.buildAddLinks(depth) + '</li>';
        }

        html += '</ul>';
        return html;
    },

    createDiscountObject: function() {
        return {
            condition_compare: {},
            action_compare: {},
            is_percent: false,
            value: 0
        };
    },

    createCompareObject: function() {
        return {
            operator: '',
            conditions: []
        };
    },

    createConditionObject: function() {
        return {
            name: '',
            is_not: false,
            entity_type: '',
            entity_field: '',
            operator: '',
            compare_value: ''
        };
    },

    traverseCompareTree: function(el) {
        var self = this;

        var compareObj = this.createCompareObject();
        el.children().each(function() {
            var child = $(this);
            if (child.hasClass('compare-conditions')) {
                var lines = child.children();
                lines.each(function() {
                    var line = $(this);
                    if (line.hasClass('condition')) {
                        var condition = self.createConditionObject();
                        condition.operator = line.find('select.condition-operator').val();

                        // TODO : make sure this is consistent with both select and text input
                        condition.compare_value = line.find('.condition-value').val();

                        var entityType = '';
                        if (typeof compareObj.operator != 'undefined' && ['product', 'shipment', 'customer'].indexOf(compareObj.operator) > -1) {
                            entityType = compareObj.operator;
                        } else {
                            entityType = line.find('select.entity-type').val();
                        }
                        condition.entity_type = entityType;

                        condition.entity_field = line.find('select.entity-field').val();
                        compareObj.conditions.push(condition);
                    } else if (line.hasClass('condition-compare')) {
                        compareObj.conditions.push(self.traverseCompareTree(line));
                    }
                });
            } else if (child.hasClass('condition-comparison')) {
                compareObj.operator = child.find('select.compare-operator').val();
            }
        });

        return compareObj;
    },

    buildDiscount: function(el) {
        var discount = this.createDiscountObject();
        discount.condition_compare = this.traverseCompareTree($(el.find('li.root.conditions')));
        discount.action_compare = this.traverseCompareTree($(el.find('li.root.actions')));
        return discount;
    },

    populateConditionsWidget: function(conditionsObj, targetObj) {
        this.populateCompareTree($(this.containerEl.find('li.root.conditions')), conditionsObj, 1, false);
        this.populateCompareTree($(this.containerEl.find('li.root.actions')), targetObj, 1, true);
    },

    populateCompareTree: function(el, compareObj, depth, isTarget) {
        var self = this;

        if (compareObj.hasOwnProperty('conditions')) {
            // add the div and ul elements to the container
            //  the div is for the logical operators: and, or, product, shipment, customer
            //  the ul is for the conditions, condition-compares
            el.append(this.buildCompareControl(el, compareObj, isTarget) + this.buildConditionsContainer(false));

            // ul element from conditions container . this is created in the previous lines
            var cEl = el.find('ul.compare-conditions');

            for(var x = 0; x < compareObj.conditions.length; x++) {

                var condition = compareObj.conditions[x];
                if (condition.hasOwnProperty('conditions')) {

                    // append li , for another compare container
                    var newEl = cEl.append('<li class="condition-compare"></li>').find('li.condition-compare').last();

                    // add a div and ul to the newly created li element
                    self.populateCompareTree(newEl, condition, depth + 1);
                } else {

                    // add condition to list of conditions
                    cEl.append('<li class="condition">' + this.buildCondition(condition, cEl.parent()) + '</li>');
                }
            }

            // add an extra link for controls
            cEl.append('<li>' + this.buildAddLinks(depth) + '</li>');
        } else if (el.hasClass('root')) {
            // if we're populating with an empty object, just populate the first part , with links
            el.append(this.buildCompareControl(el, compareObj, isTarget) + this.buildConditionsContainer(true));
        }

        return true;
    },

    serialize: function() {
        var discount = this.buildDiscount(this.containerEl);
        this.conditionInput.val(JSON.stringify(discount.condition_compare));
        if (typeof this.targetInput != 'undefined') {
            this.targetInput.val(JSON.stringify(discount.action_compare));
        }
        return this;
    },

    getConditionText: function() {
        var container = this.containerEl;
        var discount = this.buildDiscount(container);
        return JSON.stringify(discount.condition_compare);
    },

    getActionText: function() {
        var container = this.containerEl;
        var discount = this.buildDiscount(container);
        return JSON.stringify(discount.action_compare);
    }
};
