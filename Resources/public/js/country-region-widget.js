
var CountryRegionWidget = function(obj) {
    this.countryRegions = obj.countryRegions;
    this.attachEvents();
    this.updateRegionInputs();
    return this;
};

CountryRegionWidget.prototype = {
    attachEvents: function() {
        var widget = this;
        $('.country-input').change(function(e){
            var self = $(this);
            var regionInput = widget.findAssocRegionInput(self);
            widget.updateRegionInput(regionInput, self);
        });
    },
    updateRegionInputs: function() {
        var widget = this;
        $('.country-input').each(function(e){
            var countryInput = $(this);
            var regionInput = widget.findAssocRegionInput(countryInput);
            widget.updateRegionInput(regionInput, countryInput);
        });
    },
    findAssocRegionInput: function(countryInput) {
        return countryInput.parent().parent().find('.region-input');
    },
    updateRegionInput: function(regionInput, countryInput) {

        var widget = this;

        var countryCode = countryInput.val();
        var regionInputId = regionInput.attr('id');
        var regionInputName = regionInput.attr('name');
        var regionInputValue = regionInput.val();
        var regionInputClass = regionInput.attr('class');

        if (typeof widget.countryRegions[countryCode] != 'undefined') {
            var select = '<select name="' + regionInputName + '" id="' + regionInputId + '" class="' + regionInputClass + '">';
            for (regionCode in widget.countryRegions[countryCode]) {
                var regionName = widget.countryRegions[countryCode][regionCode];
                select += '<option value="' + regionCode + '"';
                if (regionCode == regionInputValue) {
                    select += ' selected="selected"';
                }
                select += '>' + regionName + '</option>';
            }
            select += '</select>';
            regionInput.replaceWith(select);
        } else {
            // todo: build text input

        }
    }
};
