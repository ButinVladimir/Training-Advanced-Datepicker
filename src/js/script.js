$(function() {
    /**
     * Date range type storage instance
     * @var {DatepickerRangeTypeStorage}
     */
    var datepickerRangeTypeStorage = new DatepickerRangeTypeStorage();
    [
        new DatepickerRangeType(1, 'range-1', 'Reminder'),
        new DatepickerRangeType(2, 'range-2', 'Meeting'),
        new DatepickerRangeType(3, 'range-3', 'Appointment'),
    ].forEach(function(v) {
        datepickerRangeTypeStorage.add(v);
    });

    /**
     * Date range storage instance
     * @var {DatepickerRangeStorage}
     */
    var datepickerRangeStorage = null;

    /**
     * Datepicker instance
     * @var {Datepicker}
     */
    var datepicker = null;

    /*
     * Plugin
     */
    $.fn.datepicker = function() {
        if (datepickerRangeStorage === null) {
            datepickerRangeStorage = new DatepickerRangeStorage(datepickerRangeTypeStorage);
        }

        if (datepicker === null) {
            datepicker = new Datepicker(datepickerRangeStorage, datepickerRangeTypeStorage);
        }

        $(this).each(function() {
            var $this = $(this);
            $this.on('datepicker.show', function(e, posX, posY) {
                datepicker.showWindow(posX, posY);
            });
        });

        return this;
    };


    /*
     * Usage
     */
    $('#target').datepicker().click(function(e) {
        e.stopPropagation();

        $(this).trigger('datepicker.show', '200px', '200px');
    });
});
