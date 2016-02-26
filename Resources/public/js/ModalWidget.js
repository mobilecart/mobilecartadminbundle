
var ModalWidget = function ModalWidget(info) {
    this.containerEl = info.containerEl; // modal container
    this.actions = info.actions;
    this.action = '';
    this.inputEl = '';
    this.attachEvents();
};

ModalWidget.prototype = {
    attachEvents: function() {
        var widget = this;

        // the submit button
        this.containerEl.delegate('button#modal-shared-submit', 'click', function(e){
            e.preventDefault();
            var self = $(this);
            var action = self.attr('data-action');
            widget.setAction(action);
            widget.submit();
        });

        return this;
    },
    addAction: function(action) {
        this.actions.push(action);
        return this;
    },
    setAction: function(action) {
        this.action = action;
        return this;
    },
    getAction: function() {
        return this.action;
    },
    setActions: function(actions) {
        this.actions = actions;
        return this;
    },
    getActionObject: function() {
        var action = this.getAction();
        for (var x = 0; x < this.actions.length; x++) {
            var actionObject = this.actions[x];
            if (actionObject.input == action) {
                return actionObject;
            }
        }
        return false;
    },
    setLabel: function(label) {
        this.containerEl.find('#modal-shared-label').html(label);
    },
    setBody: function(html) {
        this.containerEl.find('#modal-shared-body').html(html);
    },
    hideSubmit: function() {
        // todo
    },
    showSubmit: function() {
        // todo
    },
    render: function() {
        var obj = this.getActionObject();

        this.containerEl.find('#modal-shared-label').html(obj.label);

        // build html for replacing parts of modal
        // replaces input, input label

        var html = '<div><label>' + obj.input_label + '</label>';
        if (obj.input_type == 'select' || obj.input_type == 'multiselect') {
            html += '<select name="value" class="form-control modal-input">';
            for (var x = 0; x < obj.input_options.length; x++) {
                var option = obj.input_options[x];
                html += '<option value="' + option.value + '">' + option.label + '</option>';
            }
            html += '</select>';
        } else if (obj.input_type == 'text') {
            html += '<input type="text" name="value" value="" class="form-control modal-input" />';
        }

        html += '</div>';
        this.containerEl.find('#modal-shared-body').html(html);
        this.inputEl = this.containerEl.find('select[name="value"]');
        if (!this.inputEl.length) {
            this.inputEl = this.containerEl.find('input[name="value"]');
        }
        return this;
    },
    submit: function() {
        var widget = this;

        // gather ids
        var ids = [];
        $('input.mass-action').each(function(){
            var self = $(this);
            if (self.prop('checked')) {
                ids.push(self.val());
            }
        });

        // retrieve / build url
        var actionObject = widget.getActionObject();
        var value = widget.inputEl.val();
        var url = actionObject.url;

        $.ajax({
            type: "POST",
            url: url,
            data: {
                item_ids: ids,
                var_code: widget.action,
                value: value
            },
            dataType: 'json',
            success: function(response){
                window.location.reload(true);
            }
        });

        return false;
    }
};
