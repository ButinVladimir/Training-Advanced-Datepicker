/**
 * Hide time for warnings
 */
var HIDE_TIME = 2000;


/**
 * Window template
 */
var TEMPLATE = $('#template').html();


/**
 * Date range type template
 */
var TYPE_TEMPLATE = $('#type-template').html();

/**
  * Date picker main class
  * Constructor
 *
 * @param {DatepickerRangeStorage} rangeStorage
 * @param {DatepickerRangeTypeStorage} typeStorage
 */            
function Datepicker(rangeStorage, typeStorage) {
    if (!(rangeStorage instanceof DatepickerRangeStorage)) {
        throw new Error('rangeStorage must be instance of DatepickerRangeStorage');
    }
    this._rangeStorage = rangeStorage;

    if (!(typeStorage instanceof DatepickerRangeTypeStorage)) {
        throw new Error('typeStorage must be instance of DatepickerRangeStorage');
    }
    this._typeStorage = typeStorage;

    this._$window = null;

    this._startCalendar = null;
    this._finishCalendar = null;

    this._$typesBlock = null;

    this._$addBtn = null;
    this._$clearBtn = null;

    this._$success = null;
    this._$cleared = null;
    this._$warning = null;
    this._$override = null;

    this._selectedRange = new DatepickerRange(new Date(), new Date(), this._typeStorage.getFirst());
}

/**
 * Display window
 *
 * @param {number} posX
 * @param {number} posY
 */
Datepicker.prototype.showWindow = function(posX, posY) {
    if (this._$window === null) {
        this._renderWindow();
        this._registerHandlers();
    }

    this._$window.css('left', posX);
    this._$window.css('top', posY);
    this._$window.show();
};

/**
 * Hide window
 */
Datepicker.prototype.hideWindow = function() {
    if (this._$window !== null) {
        this._$window.hide();
    }
};

/**
 * Render window
 */
Datepicker.prototype._renderWindow = function() {
    this._$window = $('<div class="datepicker-window"></div>');
    this._$window.html(TEMPLATE);

    this._renderTypes();

    this._$success = this._$window.find('.datepicker-success');
    this._$cleared = this._$window.find('.datepicker-cleared');
    this._$intersect = this._$window.find('.datepicker-intersect');
    this._$override = this._$window.find('.datepicker-override input');

    this._startCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-start'));
    this._finishCalendar = new DatepickerCalendar(this._rangeStorage, this._typeStorage, this._selectedRange, this._$window.find('.datepicker-calendar-finish'));
    this._renderCalendars();

    this._$addBtn = this._$window.find('.datepicker-btn-add');
    this._$clearBtn = this._$window.find('.datepicker-btn-clear');

    $('body').append(this._$window);
};

/**
 * Render types selection
 */
Datepicker.prototype._renderTypes = function() {
    this._$typesBlock = this._$window.find('.datepicker-options');

    this._typeStorage.iterate((function(type) {
        var row = $(TYPE_TEMPLATE),
            $input = row.find('input');
        $input.data('type', type.getValue());

        if (type == this._selectedRange.getType()) {
            $input.prop('checked', true);
        }
        row.find('.datepicker-type-text').html(type.getDescription());

        this._$typesBlock.append(row);
    }).bind(this)) ;
};

/**
 * Render calendars and intersection warning
 */
Datepicker.prototype._renderCalendars = function() {
    this._startCalendar.render();
    this._finishCalendar.render();

    this._$intersect.toggle(this._isSelectedRangeIntersect());
};

/**
 * Register handlers
 */
Datepicker.prototype._registerHandlers = function() {
    var self = this;

    $(document).click(function() {
        self.hideWindow();
    });
    this._$window.click(function(e) {
        e.stopPropagation();
    });

    this._startCalendar.registerHandlers();
    this._finishCalendar.registerHandlers();

    this._startCalendar.setChangeCallback((function (year, month, day) {
        this._selectedRange.getStart().setFullYear(year, month, day);
        this._renderCalendars();
    }).bind(this));
    this._finishCalendar.setChangeCallback((function(year, month, day) {
        this._selectedRange.getFinish().setFullYear(year, month, day);
        this._renderCalendars();
    }).bind(this));

    this._$addBtn.click((function(e) {
        if (this._selectedRange.getStart().getTime() > this._selectedRange.getFinish().getTime()) {
            return;
        }

        if (this._$override.prop('checked') === true || !this._isSelectedRangeIntersect()) {
            var resultRange = new DatepickerRange(
                new Date(this._selectedRange.getStart().getTime()),
                new Date(this._selectedRange.getFinish().getTime()),
                this._selectedRange.getType()
            );

            this._rangeStorage.add(resultRange);
            this._renderCalendars();

            this._$success.show();
            this._$success.hide(HIDE_TIME);
        }
    }).bind(this)) ;

    this._$clearBtn.click((function(e) {
        this._rangeStorage.clear();
        this._renderCalendars();

        this._$cleared.show();
        this._$cleared.hide(HIDE_TIME);
    }).bind(this));

    this._$typesBlock.on('change', 'input', function() {
        self._selectedRange.setType(self._typeStorage.get($(this).data('type')));
    });
};

/**
 * Is selected range intersecting added ranges
 *
 * @return {boolean}
 */
Datepicker.prototype._isSelectedRangeIntersect = function() {
    var isIntersect = false,
        self = this;

    this._rangeStorage.getDates().forEach(function(range) {
        if (self._selectedRange.isIntersect(range)) {
            isIntersect = true;
        }
    });

    return isIntersect;
};
