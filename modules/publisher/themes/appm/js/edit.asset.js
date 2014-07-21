/*
 Description: The script is used to edit an asset
 Filename: edit.asset.js
 Created Date: 17/8/2013
 */
$(function() {

	//The container used to display messages to the user
	var MSG_CONTAINER = '#msg-container-recent-activity';
	var ERROR_CSS = 'alert alert-error';
	var SUCCESS_CSS = 'alert alert-info';
	var CHARS_REM = 'chars-rem';
	var DESC_MAX_CHARS = 995;

	$('#overview_description').after('<span class="span8 ' + CHARS_REM + '"></span>');
		
	  // let's fill all the permissions
    $.each($('.perm-check'), function () {
        // var checkbox = $(checkbox);

        if($(this).attr('data-permissions').indexOf($(this).attr('data-perm')) > -1) {
            $(this).attr('checked', true);
        } else {
            $(this).attr('checked', false);
        }
    });

	$('#editAssetButton').on('click', function() {

		var data = {};
		//var formData=new FormData();

		//Obtain the current url
		var url = window.location.pathname;

		//The type of asset
		var type = $('#meta-asset-type').val();

		//The id
		//Break the url into components
		var comps = url.split('/');

		//Given a url of the form /pub/api/asset/{asset-type}/{asset-id}
		//length=5
		//then: length-2 = {asset-type} length-1 = {asset-id}
		var id = comps[comps.length - 1];

		//Extract the fields
		var fields = $('#form-asset-edit :input');

		//Create the data object which will be sent to the server
		/*
		fields.each(function () {

		if ((this.type != 'button')&&(this.type!='reset')&&(this.type!='hidden')) {
		data[this.id] = this.value;
		formData=fillForm(this,formData);
		}
		});*/

		// console.log(JSON.stringify(formData));

		var url = '/publisher/api/asset/' + type + '/' + id;

		var options = {

			beforeSubmit : function(arr, $form, options) {
				
				//Extract the fields
              // var fields = $('#form-asset-edit :input');
       
               //Create the data object which will be sent to the server
             
              /*
               fields.each(function () {
                                  
                                              if ((this.type != 'button')&&(this.type!='reset')&&(this.type!='hidden')) {
                                                  data[this.id] = this.value;
                                                  formData=fillForm(this,arr);
                                              }
                                          });
              */
              

//				for (var i in arr) {
//
//					if (arr[i].type == 'file' && arr[i].value == '') {
//
//						arr[i].value = $('#' + arr[i].name).val();
//
//					}
//				}

				//console.log(arr);


			},
			success : function(response) {

				var result = JSON.parse(response);

				if (result.ok) {
					var asset = result.asset;
					createMessage(MSG_CONTAINER, SUCCESS_CSS, 'Asset updated successfully');
					updateFileFields(asset);
				    (function setupPermissions() {
                        var rolePermissions = [];
                        $('.role-permission').each(function(i, tr) {
                            var role = $(tr).attr('data-role');

                            var permissions = [];

                            $(tr).children('td').children(':checked').each(function(j, checkbox) {
                                permissions.push($(checkbox).attr('data-perm'));
                            });

                            rolePermissions.push({
                                role: role,
                                permissions: permissions
                            });
                        });


                        if (rolePermissions.length > 0) {
                            $.ajax({
                                url: '/publisher/asset/' + type + '/id/' + id + '/permissions',
                                type: 'POST',
                                processData: false,
                                contentType: 'application/json',
                                data: JSON.stringify(rolePermissions),
                                success: function(response) {
                                	showModel(type,id);
                                },
                                error: function(response) {
                                    showAlert('Error adding permissions.', 'error');
                                }
                            });
                        }else {
                        	showModel(type,id);
                        }
                        
                        
                    })();
				} else {
					var report = processErrorReport(result.report);
					createMessage(MSG_CONTAINER, ERROR_CSS, report);
				}

			},
			error : function(response) {
				createMessage(MSG_CONTAINER, ERROR_CSS, 'Asset was not updated successfully.');
			},

			// other available options:
			url : url, // override for form's 'action' attribute
			type : 'POST' // 'get' or 'post', override for form's 'method' attribute
			//dataType:  null        // 'xml', 'script', or 'json' (expected server response type)
			//clearForm: true        // clear all form fields after successful submit
			//resetForm: true        // reset the form after successful submit

			// $.ajax options can be used here too, for example:
			//timeout:   3000
		};

		$('#form-asset-edit').ajaxSubmit(options);

	});

	$('#overview_description').keyup(function() {
		var self = $(this), length = self.val().length, left = DESC_MAX_CHARS - length, temp;

		if (length > DESC_MAX_CHARS) {
			temp = self.val();
			$(this).val(temp.substring(0, DESC_MAX_CHARS));
			//console.log("Max chars reached");
			return;
		}
		$('.' + CHARS_REM).text('Characters left: ' + left);
	});
	
	
	 $('#roles').tokenInput('/publisher/api/lifecycle/information/meta/' + $('#meta-asset-type').val() + '/roles', {
	        theme: 'facebook',
	        preventDuplicates: true,
	        onAdd: function(role) {
	            var permission = $('<tr class="role-permission" data-role="' + role.id + '"><td>' + role.name + '</td><td><input data-perm="GET" type="checkbox" value=""></td><td><input data-perm="PUT" type="checkbox" value=""></td><td><input data-perm="DELETE" type="checkbox" value=""></td><td><input data-perm="AUTHORIZE" type="checkbox" value=""></td></tr>')
	            $('#permissionsTable > tbody').append(permission);
	        },
	        onDelete: function(role) {
	            console.log()
	            $('#permissionsTable tr[data-role="' + role.id + '"]').remove();
	        }
	    });

	/*
	 The function updates the file upload fields after recieving a response from
	 the server
	 @asset: An updated asset instance
	 */
	function updateFileFields(asset) {
		var fields = $('#form-asset-edit :input');
		var fieldId;
		var previewId;
		var fieldValue;
		var inputField;

		fields.each(function() {

			//We only to update the file fields
			if (this.type == 'file') {
				fieldId = this.id;
				previewId = getFileLabelId(fieldId);
				fieldValue = asset.attributes[fieldId];

				inputField = $('#' + fieldId);

				var e = inputField;
				e.wrap('<form>').parent('form').trigger('reset');
				e.unwrap();

				//$('#img-preview-'+ fieldId).attr('src', fieldValue);
				//Update the label
				$('#' + previewId).html(fieldValue);
			}
		});
	}

	function getFileLabelId(fieldId) {
		return 'preview-' + fieldId;
	}

	/*
	 The function is used to add a given field to a FormData element
	 @field: The field to be added to the formData
	 @formData: The FormDara object used to store the field
	 @return: A FormData object with the added field
	 */
	function fillForm(field, formData) {
		var fieldType = field.type;

		if (fieldType == 'file') {
			//Only add the file if the user has selected a new file
			if (field.files[0]) {
				formData.push({name:field.name,value:field.files[0],type:fieldType});
			} else {
				//Locate the existing url from the preview label
				var existingUrl = $('#preview-' + field.id).html();
				formData({name:field.name, value:exisitingUrl, type:'text'});
			}
		} else {
			formData.push({name:field.name,value:field.value});
		}

		return formData;
	}

	/*
	 The function is used to build a report message indicating the errors in the form
	 @report: The report to be processed
	 @return: An html string containing the validation issues
	 */
	function processErrorReport(report) {
		var msg = '';
		for (var index in report) {

			for (var item in report[index]) {
				msg += report[index][item];
			}
		}

		return msg;
	}

	/*
	 The function creates a message and displays it in the provided container element.
	 @containerElement: The html element within which the message will be displayed
	 @cssClass: The type of message to be displayed
	 @msg: The message to be displayed
	 */
	function createMessage(containerElement, cssClass, msg) {
		var date = new Date();
		var time = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
		var infoMessage = '<div class="' + cssClass + '">' + '<a data-dismiss="alert" class="close">x</a>' + time + ' ' + msg + '</div';

		//Place the message
		$(containerElement).html(infoMessage);
	}
	
	var showModel=function(type,id){
		
		  
    	
		   console.info('Successfully updated Web app: ');
		   //alert('Succsessfully subscribed to the '+subscription.apiName+' Web App.');
		   
		    $('#messageModal1').html($('#confirmation-data1').html());
		    $('#messageModal1 h3.modal-title').html(('Updating Successful'));
		    $('#messageModal1 div.modal-body').html('\n\n'+ ('Congratulations! You have successfully updated the Web App ')+ '</b>');
		    $('#messageModal1 a.btn-other').html('OK');
		    
		   
		    $('#messageModal1').modal();
		    $("#messageModal1").on('hidden.bs.modal', function(){
		    	window.location = '/publisher/asset/' + type + '/'+id;
		    });

};


	$('.selectpicker').selectpicker();

});
