searchVisible = 0;
transparent = true;

$(document).ready(function() {

    /*  Activate the tooltips      */
    $('[rel="tooltip"]').tooltip();

    // Code for the Validator
    var $validator = $('.wizard-card form').validate({
        rules: {
            c_name: {
                required: true,
                minlength: 3
            },
            cin_num: {
                required: true,
                minlength: 3
            },
            email: {
                required: true,
                minlength: 3
            },
            pass: {
                required: true,
                minlength: 5
            },
            repass: {
                required: true,
                equalTo: "#paw"
            },
            ceo_name: {
                required: true,
                minlength: 2
            },
            c_code: {
                maxlength: 2
            },
            phone:{
                maxlength: 11
            },
            desc: {
                required: true
            },
            loc: {
                required: true
            },
            city: {
                required: true
            },
            state: {
                required: true
            },
            country: {
                required: true
            },
            postal:{
                required: true,
                maxlength:6
            }
        }
    });
    // ---------------------Password strength-------------------------
    var pw_test = function(str) {
        var WeakPass = /(?=.{5,}).*/; //Must contain 5 characters or more
        var MediumPass = /^(?=\S*?[a-z])(?=\S*?[A-Z])\S{5,}$/; //Must contain lower case letters and at least one digit.
        var StrongPass = /^(?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9])\S{5,}$/; //Must contain at least one upper case letter, one lower case letter and one digit.
        var VryStrongPass = /^(?=\S*?[A-Z])(?=.*[@$!%*#?&])(?=\S*?[a-z])(?=\S*?[0-9])(?=\S*?[^\w\*])\S{5,}$/; //Must contain at least one upper case letter, one lower case letter and one digit.

        if (VryStrongPass.test(str)) {
            return {
                strength: 'very_strong',
                text: 'Very Strong! (Awesome, please don\'t forget your pass now!)'
            };
        } else if (StrongPass.test(str)) {
            return {
                strength: 'strong',
                text: 'Strong! (Enter Special Characters to make even stronger)'
            };
        } else if (MediumPass.test(str)) {
            return {
                strength: 'medium',
                text: 'Good! (Enter Number letter to make strong)'
            };
        } else if (WeakPass.test(str)) {
            return {
                strength: 'weak',
                text: 'Still Weak! (Enter Uppercase and Lowercase to make good password)'
            };
        } else {
            return {
                strength: 'very_weak',
                text: 'Very Weak! (Must be 5 or more chars)'
            };
        }
    };
    var password1 = $('#paw'); //id of first password field
    var strength_indicator = $('#strength-indicator'); //id of indicator element

    //check password strength when user types in
    $(password1).on('keyup', function(e) {
        var pwd_strength = pw_test(password1.val());
        switch (pwd_strength.strength) {
            case 'very_weak':
                strength_indicator.removeClass().addClass('very_weak').html(pwd_strength.text).css("color","#f20a0a");
                break;
            case 'weak':
                strength_indicator.removeClass().addClass('weak').html(pwd_strength.text).css("color","#f50535");
                break;
            case 'medium':
                strength_indicator.removeClass().addClass('medium').html(pwd_strength.text).css("color","#f58905");
                break;
            case 'strong':
                strength_indicator.removeClass().addClass('strong').html(pwd_strength.text).css("color","#6ECB63");
                break;
            case 'very_strong':
                strength_indicator.removeClass().addClass('very_strong').html(pwd_strength.text).css("color","#3d9c14");
                break;
        }
    });
    //----------------------------------end---------------------------------------------

    // ---------------------------------Logo Upload-------------------------------------
    
    $("#wizard_picture").change(function(e){
        if(e.target.files[0].type=="image/jpeg" || e.target.files[0].type=="image/png"){
            readURL(this);
        }
    })

    

    // Wizard Initialization
    $('.wizard-card').bootstrapWizard({
        'tabClass': 'nav nav-pills',
        'nextSelector': '.btn-next',
        'previousSelector': '.btn-previous',

        onNext: function(tab, navigation, index) {
            var $valid = $('.wizard-card form').valid();
            if (!$valid) {
                $validator.focusInvalid();
                return false;
            }
        },

        onInit: function(tab, navigation, index) {

            //check number of tabs and fill the entire row
            var $total = navigation.find('li').length;
            $width = 100 / $total;
            var $wizard = navigation.closest('.wizard-card');

            $display_width = $(document).width();

            if ($display_width < 600 && $total > 3) {
                $width = 50;
            }

            navigation.find('li').css('width', $width + '%');
            $first_li = navigation.find('li:first-child a').html();
            $moving_div = $('<div class="moving-tab">' + $first_li + '</div>');
            $('.wizard-card .wizard-navigation').append($moving_div);
            refreshAnimation($wizard, index);
            $('.moving-tab').css('transition', 'transform 0s');
        },

        onTabClick: function(tab, navigation, index) {

            var $valid = $('.wizard-card form').valid();

            if (!$valid) {
                return false;
            } else {
                return true;
            }
        },

        onTabShow: function(tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;

            var $wizard = navigation.closest('.wizard-card');

            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                $($wizard).find('.btn-next').hide();
                $($wizard).find('.btn-finish').show();
            } else {
                $($wizard).find('.btn-next').show();
                $($wizard).find('.btn-finish').hide();
            }

            button_text = navigation.find('li:nth-child(' + $current + ') a').html();

            setTimeout(function() {
                $('.moving-tab').text(button_text);
            }, 150);

            var checkbox = $('.footer-checkbox');

            if (!index == 0) {
                $(checkbox).css({
                    'opacity': '0',
                    'visibility': 'hidden',
                    'position': 'absolute'
                });
            } else {
                $(checkbox).css({
                    'opacity': '1',
                    'visibility': 'visible'
                });
            }

            refreshAnimation($wizard, index);
        }
    });


    // Prepare the preview for profile picture
    // $("#wizard_picture").change(function() {
    //     readURL(this);
    //     console.log(readURL(this))
    // });

    $('[data-toggle="wizard-radio"]').click(function() {
        wizard = $(this).closest('.wizard-card');
        wizard.find('[data-toggle="wizard-radio"]').removeClass('active');
        $(this).addClass('active');
        $(wizard).find('[type="radio"]').removeAttr('checked');
        $(this).find('[type="radio"]').attr('checked', 'true');
    });

    $('[data-toggle="wizard-checkbox"]').click(function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $(this).find('[type="checkbox"]').removeAttr('checked');
        } else {
            $(this).addClass('active');
            $(this).find('[type="checkbox"]').attr('checked', 'true');
        }
    });

    $('.set-full-height').css('height', 'auto');

});



//Function to show image before upload

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            $('#wizardPicturePreview').attr('src', e.target.result).fadeIn('slow');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

$(window).resize(function() {
    $('.wizard-card').each(function() {
        $wizard = $(this);
        index = $wizard.bootstrapWizard('currentIndex');
        refreshAnimation($wizard, index);

        $('.moving-tab').css({
            'transition': 'transform 0s'
        });
    });
});

function refreshAnimation($wizard, index) {
    total_steps = $wizard.find('li').length;
    move_distance = $wizard.width() / total_steps;
    step_width = move_distance;
    move_distance *= index;

    $wizard.find('.moving-tab').css('width', step_width);
    $('.moving-tab').css({
        'transform': 'translate3d(' + move_distance + 'px, 0, 0)',
        'transition': 'all 0.3s ease-out'

    });
}

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};