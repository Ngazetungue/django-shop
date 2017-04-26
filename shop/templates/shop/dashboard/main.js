{% load i18n %}
(function(angular, undefined) {
'use strict';

var djangoShopDashboard = angular.module('djangoShopDashboard');

djangoShopDashboard.config(['RestangularProvider', function(RestangularProvider) {
	RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
		if (operation == "getList") {
		}
		return {params: params};
	});

	RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
		if (operation == "getList") {
			response.totalCount = data.count;
			return data.results;
		}
		return data;
	});

}]);

djangoShopDashboard.config(['NgAdminConfigurationProvider', function(nga) {
	var admin = nga.application("Dashboard");

	//admin.baseApiUrl('http://jsonplaceholder.typicode.com/');
	admin.baseApiUrl("{% url 'dashboard:root' %}");

	var user = nga.entity('users');
	// set the fields of the user entity list view
	user.listView().fields([
		nga.field('name').isDetailLink(true),
		nga.field('username'),
		nga.field('email')
	]);
	user.creationView().fields([
		nga.field('name'),
		nga.field('username'),
		nga.field('email', 'email'),
		nga.field('address.street').label('Street'),
		nga.field('address.city').label('City'),
		nga.field('address.zipcode').label('Zipcode'),
		nga.field('phone'),
		nga.field('website')
	]);
	// use the same fields for the editionView as for the creationView
	user.editionView().fields(user.creationView().fields());

	// add the user entity to the admin application
	admin.addEntity(user);

	var post = nga.entity('posts');
	post.listView().fields([
		nga.field('id'),
		nga.field('title').isDetailLink(true),
		nga.field('userId', 'reference')
			.targetEntity(user)
			.targetField(nga.field('username'))
			.label('User')
	]);
	post.showView().fields([
		nga.field('title'),
		nga.field('body', 'text'),
		nga.field('userId', 'reference')
			.targetEntity(user)
			.targetField(nga.field('username'))
			.label('User'),
		nga.field('comments', 'referenced_list')
		.targetEntity(nga.entity('comments'))
		.targetReferenceField('postId')
		.targetFields([
			nga.field('email'),
			nga.field('name')
		])
		.sortField('id')
		.sortDir('DESC'),
	]);

	admin.addEntity(post);

	{% for name, viewset in dashboard_entities.items %}
	(function() {
		// create entity for each viewset
		var entity = nga.entity("{{ name }}");

		entity.listView().fields([{% for field in viewset.list_fields %}
			nga.{{ field }}{% if not forloop.last %},{% endif %}{% endfor %}
		]);

		entity.creationView().fields([{% for field in viewset.creation_fields %}
			nga.{{ field }}{% if not forloop.last %},{% endif %}{% endfor %}
		]);

		entity.editionView().fields([{% for field in viewset.edition_fields %}
			nga.{{ field }}{% if not forloop.last %},{% endif %}{% endfor %}
		]).onSubmitError(['error', 'entity', 'form', 'progression', 'notification',
		function(error, entity, form, progression, notification) {
			debugger;
			angular.forEach(error.data, function(value, field_name) {
				if (form[field_name]) {
					form[field_name].$setValidity(false);
				}
			});
			// stop the progress bar
			progression.done();
			// add a notification
			notification.log("{% trans 'Some values are invalid, see details in the form' %}", { addnCls: 'humane-flatty-error' });
			// cancel the default action (default error messages)
			return false;
		}]);
		// register entity in admin
		admin.addEntity(entity);
	})();
	{% endfor %}

	// attach the admin application to the DOM and execute it
	nga.configure(admin);
}]);

})(window.angular);
