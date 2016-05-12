
var ConditionWidget = function(info) {
    //init parameters
    this.containerEl = info.containerEl;
    this.operators = info.operators;
    this.logicalOperators = info.logicalOperators;
    this.containerOperators = info.containerOperators;
    this.varSets = info.varSets;
    this.conditionInput = info.conditionInput;
    this.targetInput = info.targetInput;

    //hide widget inputs
    this.conditionInput.hide();
    this.targetInput.hide();

    //insert needed markup around the inputs being wrapped
    this.insertBaseMarkup();

    var preCompareObj = {};
    try {
        preCompareObj = JSON.parse(this.conditionInput.val());
    } catch(e) {
        preCompareObj = {};
    }

    var targetCompareObj = {};
    try {
        targetCompareObj = JSON.parse(this.targetInput.val());
    } catch(e) {
        targetCompareObj = {};
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
    varSets: {},
    currentVarSet: {},
    conditionInput: {},
    targetInput: {},

    insertBaseMarkup: function() {
        this.conditionInput.parent().append('<ul class="builder"><li class="condition-compare root conditions"></li></ul>');
        this.targetInput.parent().append('<ul class="builder"><li class="condition-compare root actions"></li></ul>');
        return this;
    },

    attachEvents: function() {
        var me = this;
        var cEl = this.containerEl;

        cEl.delegate('a.add-condition', 'click', function(e) {

            e.preventDefault();
            var self = $(this);
            var parent = self.parent();
            var parent3 = parent.parent().parent();

            var depth = self.attr('data-depth');
            if (typeof depth == 'undefined') {
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

            parent.html(me.buildCondition(condition, liEl));
            parent.parent().append('<li>' + me.buildAddLinks(depth) + '</li>');
        });

        cEl.delegate('a.add-compare', 'click', function(e) {
            e.preventDefault();
            var self = $(this);

            var depth = self.attr('data-depth');
            if (typeof depth == 'undefined') {
                depth = 1;
            }

            var parent = self.parent();

            var info = {
                logicalOperators: me.logicalOperators
            };

            if (!parent.hasClass('condition-compare')) {
                parent.addClass('condition-compare');
            }
            //var addRemoveLink = !parent.hasClass('root');

            var compareHtml = me.buildCompareControl(parent);
            var newDepth = depth + 1;
            compareHtml += me.buildConditionsContainer(true, newDepth);

            parent.html(compareHtml);
            parent.parent().append('<li>' + me.buildAddLinks(depth) + '</li>');
        });

        cEl.delegate('a.condition-remove', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            self.parent().parent().remove();
        });

        cEl.delegate('a.compare-remove', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            var el = self.parent().parent().parent();
            if (!el.hasClass('root')) {
                el.remove();
            }
        });

        // change fields options when changing entity type
        cEl.delegate('select.entity-type', 'change', function(e) {
            var self = $(this);
            var el = self.parent().find('select.entity-field');
            el.html(me.buildEntityTypeOptions(self.val()));
        });
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
                )
            {
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
            select += '>' + fields[field]['name'] + '</option>';
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

        if (typeof depth == 'undefined') {
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

    buildCondition: function(condition, liEl) {

        var hideEntityTypeInput = false;
        if (typeof liEl != 'undefined') {
            var compareEl = liEl.find('select.compare-operator');
            if (typeof compareEl.val() != 'undefined') {
                var selectVal = compareEl.val();
                if (selectVal.length > 1 && selectVal != 'and' && selectVal != 'or') {
                    hideEntityTypeInput = true;
                    condition.entity_type = selectVal;
                }
            }
        }

        var html = '<p>';
        html += '<a class="condition-remove" href="#">-</a>&nbsp;';
        html += this.buildSelectEntityTypes(this.varSets, condition.entity_type, hideEntityTypeInput) + ' : ';
        html += this.buildSelectEntityFields(this.varSets[condition.entity_type]['vars'], condition.entity_field) + ' : ';
        html += this.buildSelectGeneric(this.operators, 'condition-operator', condition.operator);
        html += ' : ' + this.buildText('condition-value', condition.compare_value);
        html += '</p>';
        return html;
    },

    buildCompareControl: function(el) {
        // el should be a li element
        var self = this;
        var html = '<div class="condition-comparison">';
        var addRemoveLink = !el.hasClass('root'); // parent of link element
        var parent3 = $(el).parent().parent(); // great-grandparent of link element
        var enableContainerOps = parent3.hasClass('root');// || el.hasClass('root');

        html += '<p>';
        if (addRemoveLink === true) {
            html += '<a class="compare-remove" href="#">-</a>&nbsp;';
        }

        if (enableContainerOps && typeof self.containerOperators != 'undefined') {
            html += this.buildSelectGeneric(self.containerOperators, 'compare-operator');
        } else {
            html += this.buildSelectGeneric(self.logicalOperators, 'compare-operator');
        }

        html += '</p>';
        html += '</div>';

        return html;
    },

    buildConditionsContainer: function(addLinks, depth) {
        var html = '<ul class="compare-conditions">';

        if (typeof depth == 'undefined') {
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
                        condition.compare_value = line.find('input.condition-value').val();
                        condition.entity_type = line.find('select.entity-type').val();
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
        this.populateCompareTree($(this.containerEl.find('li.root.conditions')), conditionsObj, 1);
        this.populateCompareTree($(this.containerEl.find('li.root.actions')), targetObj, 1);
    },

    populateCompareTree: function(el, compareObj, depth) {

        var self = this;
        if (compareObj.hasOwnProperty('conditions')) {

            // add the div and ul elements to the container
            //  the div is for the logical operators: and, or, product, shipment, customer
            //  the ul is for the conditions, condition-compares
            el.append(this.buildCompareControl(el) + this.buildConditionsContainer(false));

            // ul element from conditions container . this is created in the previous lines
            var cEl = el.find('ul.compare-conditions');

            for(var x = 0; x < compareObj.conditions.length; x++) {

                var condition = compareObj.conditions[x];
                if (condition.hasOwnProperty('conditions')) {

                    //console.log('compare op: ' + condition.operator + ' , conditions: ' + condition.conditions.length);

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
            cEl.append('<li>'+this.buildAddLinks(depth)+'</li>');
        } else if (el.hasClass('root')) {
            // if we're populating with an empty object, just populate the first part , with links
            el.append(this.buildCompareControl(el) + this.buildConditionsContainer(true));
        }

        return true;
    },

    serialize: function() {
        var discount = this.buildDiscount(this.containerEl);
        this.conditionInput.val(JSON.stringify(discount.condition_compare));
        this.targetInput.val(JSON.stringify(discount.action_compare));
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
