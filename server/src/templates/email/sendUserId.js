var registration = function(companyLogo, userId) {
	return (
		`
			<mjml>
			  <mj-body>
			    <mj-section background-color="#f0f0f0">
			      <mj-column>
			        <mj-image width="200"
              			src=${companyLogo}
              		/>
 			      </mj-column>
			    </mj-section>
			    <mj-section>
			    	<mj-text>
			    		Hi, <b>${userId}</b> is your unique id for our platform. Please save this id and login with the same. Happy trading !
			    	</mj-text>
			    </mj-section>
			  </mj-body>
			</mjml>
		`
	);
};

module.exports = registration;