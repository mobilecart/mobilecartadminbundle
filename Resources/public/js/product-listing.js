
// Sortable
App.models.Sortable = Backbone.Model.extend({});
App.collections.SortableCollection = Backbone.Collection.extend({
    model: App.models.Sortable
});

// AdvFilter
App.models.AdvFilter = Backbone.Model.extend({});
App.collections.AdvFilterCollection = Backbone.Collection.extend({
    model: App.models.AdvFilter
});

// Products
App.models.Item = Backbone.Model.extend({});
App.collections.PaginatedCollection = Backbone.PageableCollection.extend({
    key: '',
    url: App.serverURL + '/admin/product/',
    mode: 'server',
    model: App.models.Item,
    state: {
        pageSize: 30,
        sortKey: 'name',
        order: 1,
        currentPage: 1,
        totalPages: null,
        totalRecords: null
    },
    queryParams: {
        sortKey: 'sort',
        order: 'direction',
        directions: {
            "-1": 'asc',
            "1": 'desc'
        },
        currentPage: 'page',
        format: 'json'
    },
    parse: function(fullResponse) {

        var response = fullResponse.result;
        var search = fullResponse.search;

        // Set state
        this.state.totalRecords = parseInt(response.total);
        this.state.totalPages = parseInt(response.pages);
        var key = this.key;

        if (key.length > 0) {

            // handle table header sorting
            if (typeof(App.views.dynamic['sortable_' + key]) === 'undefined' ||
                App.views.dynamic['sortable_' + key] === null) {

                App.collections.dynamic['sortable_' + key] = new App.collections.SortableCollection(search.sortable);

                App.views.dynamic['sortable_' + key] = new App.views.TableHeading({
                    collection: App.collections.dynamic['sortable_' + key],
                    el: '#' + key + ' table thead.grid-header'
                });
                App.views.dynamic['sortable_' + key].key = key;
                App.views.dynamic['sortable_' + key].render(); // view should be changing based on model changes
            } else {
                App.collections.dynamic['sortable_' + key].reset(search.sortable);
            }

            // handle adv. filters
            if (typeof(App.views.dynamic['adv_filters_' + key]) === 'undefined' ||
                App.views.dynamic['adv_filters_' + key] === null) {

                App.collections.dynamic['adv_filters_' + key] = new App.collections.AdvFilterCollection(search.advFilters);

                App.views.dynamic['adv_filters_' + key] = new App.views.GridFilterView({
                    collection: App.collections.dynamic['adv_filters_' + key],
                    el: '#' + key + ' div#' + key + '-filters-container'
                });

                App.views.dynamic['adv_filters_' + key].key = key;
                App.views.dynamic['adv_filters_' + key].ops = search.advFilterOps; // [{code:'gt',label:'Greater Than',types:["number","date"]},..]
                App.views.dynamic['adv_filters_' + key].filterable = search.filterable; //*/

                App.views.dynamic['adv_filters_' + key].render(); // view should be changing based on model changes
            } else {
                App.collections.dynamic['adv_filters_' + key].reset(search.advFilters);
            }

        } else {
            // no key ?
        }

        // Render Faceted Search
        //App.collections.facets = new App.collections.FacetCollection(response.facetCounts);
        //App.views.facets = new App.views.FacetCollectionView({collection: App.collections.facets});
        //App.views.facets.render();

        return response.entities;
    }
});

//View for product listing
App.views.ProductList = Backbone.View.extend({
    el : '.product-list',
    selected: [],
    key: '',
    checkPrefix: '',
    initialize: function() {
        var items = this.collection;
        items.on('add', this.addOne, this);
        this.render();
    },
    render: function() {
        this.$el.html('');
        return this;
    },
    addOne: function(item) {
        var view = new App.views.ItemView({ model:item });
        view.selected = this.selected;
        view.key = this.key;
        view.checkPrefix = this.checkPrefix;
        this.$el.append(view.render().el);
        return this;
    }
});

App.views.ItemView = Backbone.View.extend({
    tagName: 'tr',
    className: 'item-grid',
    selected: [],
    key: '',
    checkPrefix: '',
    events: {
        'click input.select-product': 'productClick'
    },
    template: _.template($('#product-grid-single').html()),
    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('remove', this.remove, this);
    },
    render: function() {
        var self = this;
        var item = this.model.toJSON();
        var itemId = item.id;

        if (self.selected.indexOf(itemId) > -1) {
            item.checked = 1;
        } else {
            item.checked = 0;
        }

        item.key = self.key;

        this.$el.html(this.template(item));
        return this;
    },
    productClick: function(e) {
        var self = this;
        var link = $(e.currentTarget);
        var idStr = link.attr('id');
        var idParts = idStr.split('-');
        var id = idParts[1];
        var selector = 'input#' + self.checkPrefix + id;
        var checkbox = $(selector);
        if (checkbox.length > 0) {
            checkbox.parent().remove();
        } else {
            var html = '<div><input type="checkbox" checked="checked" value="'+id+'" name="config_ids['+id+']" id="' + self.checkPrefix + id + '"> '+id+'</div>';
            var panelSelctor = 'div#' + self.key + '-ids-panel';
            $(panelSelctor).append(html);
        }
    }
});

App.views.GridFilterView = Backbone.View.extend({
    key: '',
    filterable: [],
    ops: [],
    count: 0,
    el: '',
    tagName: 'div',
    className: 'filter',
    events: {
        'click a.add-filter': 'addFilter',
        'click a.remove-filter': 'removeFilter',
        'change select.adv-filter-field': 'changeFilter'
    },
    template: _.template($('#product-grid-adv-filter').html()),
    initialize: function() {
        var items = this.collection;
        items.on('reset', this.render, this);
    },
    render: function() {

        var self = this;
        this.$el.html('');

        this.collection.each(function(filter){
            self.renderFilter(filter);
        });

        this.renderFilter({field:'id', op:'equals', value:'', type:'number'});

        return this;
    },
    changeFilter: function(e) {
        var self = this;
        var select = $(e.currentTarget);
        var field = select.find(':selected');
        var type = field.attr('data-type');
        var filterOps = select.parent().find('select.adv-filter-op');
        filterOps.html('');
        for(var x=0; x < self.ops.length; x++) {
            var op = self.ops[x];
            if (op.types.indexOf(type) > -1) {
                filterOps.append('<option value="'+op.code+'"'+" data-types='{"+'"types":'+ JSON.stringify(op.types) +"}'"+'>'+op.label+'</option>');
            }
        }

        return this;
    },
    renderFilter: function(filter) {
        this.count++;

        var type = '';
        var ops = [];
        var fields = [];
        var value = '';
        var remove = false;

        // if it's a model object
        if (!_.isUndefined(filter.attributes)) {
            for(var x=0; x < this.filterable.length; x++) {
                var field = this.filterable[x];
                if (field.code == filter.get('field')) {
                    type = field.type;
                    field.selected = 1;
                }
                fields.push(field);
            }

            for(x=0; x < this.ops.length; x++) {
                var op = this.ops[x];
                if (op.types.indexOf(type) > -1) {
                    if (filter.get('op') == op.code) {
                        op.selected = 1;
                    }
                    ops.push(op);
                }
            }

            value = filter.get('value');
            remove = true;

        } else if (!_.isUndefined(filter.type)) {

            for(var x=0; x < this.filterable.length; x++) {
                var field = this.filterable[x];
                if (_.isUndefined(filter.field) && field.code == 'id') {
                    field.selected = 1;
                }
                fields.push(field);
            }

            for(var x=0; x < this.ops.length; x++) {
                var op = this.ops[x];
                if (op.types.indexOf(filter.type) > -1) {
                    ops.push(op);
                }
            }
        } else {
            ops = this.ops;
            fields = this.filterable;
        }

        this.$el.append(this.template({
            fields: fields,
            ops: ops,
            counter: this.count,
            value: value,
            remove: remove
        }));

        // Cleanup, remove selected flag
        for(x=0; x < this.ops.length; x++) {
            var op = this.ops[x];
            if (!_.isUndefined(op.selected)) {
                delete op.selected;
            }
        }

        // Cleanup, remove selected flag
        for(var x=0; x < this.filterable.length; x++) {
            var field = this.filterable[x];
            if (!_.isUndefined(field.selected)) {
                delete field.selected;
            }
        }

        return this;
    },
    addFilter: function(e) {
        e.preventDefault();

        var link = $(e.currentTarget);
        link.removeClass('add-filter');
        link.addClass('remove-filter');
        link.html('<i class="fa fa-times fa-lg"></i>');

        this.count++;
        var ops = [];
        for(var x=0; x < this.ops.length; x++) {
            var op = this.ops[x];
            //assuming ID is first on the list
            if (op.types.indexOf('number') > -1) {
                ops.push(op);
            }
        }
        this.$el.append(this.template({
            fields: this.filterable,
            ops: ops,
            counter: this.count
        }));

        return this;
    },
    removeFilter: function(e) {
        e.preventDefault();
        var link = $(e.currentTarget);
        link.parent().remove();
        return this;
    }
});

App.views.TableButtons = Backbone.View.extend({
    key: '',
    el : 'div.adv-filter-buttons',
    tagName: 'div',
    className: 'pull-right',
    events: {
        'click button.adv-filters-search': 'updateSearch'
    },
    initialize: function() {

    },
    updateSearch: function (e) {
        e.preventDefault();
        var key = this.key;

        var counter = 0;
        App.collections.dynamic[key].queryParams.filter_field = [];
        $('#'+key+' select.adv-filter-field').each(function(){
            var self = $(this);
            App.collections.dynamic[key].queryParams.filter_field.push(self.val());
            counter++;
        });

        counter = 0;
        App.collections.dynamic[key].queryParams.filter_op = [];
        $('#'+key+' select.adv-filter-op').each(function(){
            var self = $(this);
            App.collections.dynamic[key].queryParams.filter_op.push(self.val());
            counter++;
        });

        counter = 0;
        App.collections.dynamic[key].queryParams.filter_val = [];
        $('#'+key+' input.adv-filter-val').each(function(){
            var self = $(this);
            App.collections.dynamic[key].queryParams.filter_val.push(self.val());
            counter++;
        });

        App.collections.dynamic[key].currentPage = 1;
        App.collections.dynamic[key].fetch();

        return false;
    }
});

App.views.TableHeading = Backbone.View.extend({
    key: '',
    el : 'table thead.grid-header',
    tagName: 'tr',
    events: {
        'click th': 'gotoPage',
        'click button.adv-filters-search': 'updateSearch'
    },
    initialize: function() {
        var items = this.collection;
        //items.on('add', this.addOne, this);
        //items.on('reset', this.render, this);
        items.on('all', this.render, this);
        //this.render(); // cannot render in initialize, since we're handling the key
    },
    render: function() {
        var self = this;
        this.$el.html('');
        this.$el.append('<tr>');
        this.$el.append('<th><input type="checkbox" value="1" name="product_check_all"></th>');

        this.collection.each(function(item) {
            if (['id','type','name','sku','price','qty'].indexOf(item.get('code')) >= 0) {
                self.addOne(item);
            }
        });

        this.$el.append('</tr>');
        return this;
    },
    addOne: function(item) {
        var className = 'sorting';
        if (item.get('isActive') == 1) {
            if (item.get('direction') == 'desc') {
                className = 'sorting_desc';
            } else {
                className = 'sorting_asc';
            }
        }

        var view = new App.views.TableHeadingCell({
            model: item,
            className: className
        });

        view.$el.attr('data-sort', item.get('code'));
        this.$el.append(view.render().el);

        return this;
    },
    gotoPage: function(event) {
        var self = this;
        var key = self.key;
        var link = $(event.currentTarget);
        var sort = link.attr('data-sort');
        var sortDir = '1';
        if (link.hasClass('sorting_desc')) {
            sortDir = '-1';
            link.removeClass('sorting_desc');
            link.addClass('sorting_asc');
        } else {
            link.removeClass('sorting_asc');
            link.addClass('sorting_desc');
        }

        App.collections.dynamic[key].state.sortKey = sort;
        App.collections.dynamic[key].state.order = sortDir;
        App.collections.dynamic[key].currentPage = 1;
        App.collections.dynamic[key].fetch();

        return true;
    }
});

App.views.TableHeadingCell = Backbone.View.extend({
    tagName: 'th',
    className: 'sorting',
    template: _.template($('#product-grid-header-cell').html()),
    initialize: function() {
        //this.render();
    },
    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        return this;
    }
});

App.views.PaginatedView = Backbone.View.extend({
    el: '',
    tagName: 'div',
    className: 'pull-left',
    events: {
        'click button.prev': 'gotoPrev',
        'click button.next': 'gotoNext',
        'click a.page': 'gotoPage'
    },
    template: _.template($('#pagination-template').html()),
    initialize: function () {
        this.collection.on('reset', this.render, this);
        this.collection.on('sync', this.render, this);

        //this.$el.appendTo('#{{ section_id }} .grid-pager');
        this.render();
    },
    render: function () {
        this.$el.html(this.template(this.collection.state));
        return this;
    },
    gotoPrev: function (e) {
        e.preventDefault();
        this.collection.getPreviousPage();
        return this;
    },
    gotoNext: function (e) {
        e.preventDefault();
        this.collection.getNextPage();
        return this;
    },
    gotoPage: function (e) {
        e.preventDefault();

        var page = $(e.target).text();
        this.collection.getPage(parseInt(page));
        return this;
    }
});
