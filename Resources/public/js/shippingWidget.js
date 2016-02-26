
shippingWidget = {

    containerEl: {},
    operators: {},
    logicalOperators: {},
    varSets: {},
    currentVarSet: {},
    conditionInput: {},

    initialize: function(info) {

        //init parameters
        this.containerEl = info.containerEl;
        this.operators = info.operators;
        this.logicalOperators = info.logicalOperators;
        this.varSets = info.varSets;
        this.conditionInput = info.conditionInput;

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

        this.populateConditionsWidget(preCompareObj);
        this.attachEvents();

        return this;
    },

    insertBaseMarkup: function() {
        this.conditionInput.parent().append('<ul class="builder"><li class="condition-compare root conditions"></li></ul>');
        return this;
    },

    attachEvents: function() {
        var me = this;
        var cEl = this.containerEl;

        cEl.delegate('a.add-condition', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            var parent = self.parent();

            if (!parent.hasClass('condition')) {
                parent.addClass('condition');
            }
            var condition = me.createConditionObject();

            //@todo: can we simplify buildCondition?
            //condition.entity_type = me.currentVarSet;
            parent.html(me.buildCondition(null, condition));
            parent.parent().append('<li>'+me.buildAddLinks()+'</li>');
        });

        cEl.delegate('a.add-compare', 'click', function(e) {
            e.preventDefault();
            var self = $(this);
            var parent = self.parent();
            var info = {
                logicalOperators: me.logicalOperators
            };
            if (!parent.hasClass('condition-compare')) {
                parent.addClass('condition-compare');
            }
            //var addRemoveLink = !parent.hasClass('root');

            var compareHtml = me.buildCompareControl(true);
            compareHtml += me.buildConditionsContainer(true);

            parent.html(compareHtml);
            parent.parent().append('<li>'+me.buildAddLinks()+'</li>');
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
            options += '<option value="' + option + '">' + info['name'] + '</option>';
        }
        return options;
    },

    buildSelectEntityTypes: function(types, value) {
        var select = '<select class="entity-type">';
        for(type in types) {
            var name = types[type]['name'];
            select += '<option value="' + type + '"';
            if (type == value) {
                select += ' selected="selected"';
            }
            select += '>' + name + '</option>';
            if (this.currentVarSet == '') {
                this.currentVarSet = types[type]['name'];
            }
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
        var select = '<select class="'+className+'">';
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

    buildAddLinks: function() {
        var html = '<a class="add-condition" href="#">[+condition]</a>';
        html += '<a class="add-compare" href="#">[+combination]</a>';
        return html;
    },

    buildCondition: function(varSet, condition) {
        var html = '<p><a class="condition-remove" href="#">-</a>&nbsp;';
        html += this.buildSelectEntityTypes(this.varSets, varSet) + ' : ';

        if (varSet == null || typeof varSet == 'undefined') {
            for (varSet in this.varSets) {
                break;
            }
        }

        html += this.buildSelectEntityFields(this.varSets[varSet]['vars'], condition.entity_field) + ' : ';
        html += this.buildSelectGeneric(this.operators, 'condition-operator', condition.operator);
        html += ' : ' + this.buildText('condition-value', condition.value) + '</p>';
        return html;
    },

    buildCompareControl: function(addRemoveLink) {
        var html = '<div class="condition-comparison">';
        html += '<p>';
        if (addRemoveLink === true) {
            html += '<a class="compare-remove" href="#">-</a>&nbsp;';
        }
        html += this.buildSelectGeneric(this.logicalOperators, 'compare-operator') + '</p>';
        html += '</div>';
        return html;
    },

    buildConditionsContainer: function(addLinks) {
        var html = '<ul class="compare-conditions">';
        if (addLinks) {
            html += '<li>' + this.buildAddLinks() + '</li>';
        }
        html += '</ul>';
        return html;
    },

    createShippingObject: function() {
        return {
            condition_compare: {}
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
            value: ''
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
                        condition.value = line.find('input.condition-value').val();
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

    buildShipping: function(el) {
        var shipping = this.createShippingObject();
        shipping.condition_compare = this.traverseCompareTree($(el.find('li.root.conditions')));
        return shipping;
    },

    populateConditionsWidget: function(conditionsObj) {
        this.populateCompareTree($(this.containerEl.find('li.root.conditions')), conditionsObj);
    },

    populateCompareTree: function(el, compareObj) {
        if (compareObj.hasOwnProperty('conditions')) {
            el.append(this.buildCompareControl(!el.hasClass('root')) + this.buildConditionsContainer(false));
            var cEl = el.find('ul.compare-conditions');
            for(var x = 0; x < compareObj.conditions.length; x++) {
                var condition = compareObj.conditions[x];
                if (condition.hasOwnProperty('conditions')) {
                    var newEl = cEl.append('<li class="condition-compare"></li>');
                    cEl.append('<li>'+this.buildAddLinks()+'</li>');
                    return this.populateCompareTree(newEl.find('li.condition-compare'), condition);
                } else {
                    cEl.append('<li class="condition">' + this.buildCondition(condition.entity_type, condition) + '</li>');
                }
            }
            cEl.append('<li>'+this.buildAddLinks()+'</li>');
        } else if (el.hasClass('root')) {
            el.append(this.buildCompareControl(false) + this.buildConditionsContainer(true));
        }
        return true;
    },

    serialize: function() {
        var shipping = this.buildShipping(this.containerEl);
        this.conditionInput.val(JSON.stringify(shipping.condition_compare));
    },

    getConditionText: function() {
        var container = this.containerEl;
        var shipping = this.buildShipping(container);
        return JSON.stringify(shipping.condition_compare);
    }
};
