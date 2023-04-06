var password = function(companyLogo, pass) {
	console.log(companyLogo, pass, "got in mail");
	
	return (
		`
			<mjml>
			  <mj-body>
			    <mj-section background-color="#f0f0f0">
			      <mj-column>
			        <mj-image width="200"
              src=${companyLogo} />
 			      </mj-column>
			    </mj-section>
			    <mj-section>
			    	<mj-text>
			    		Hi, your user account is created. We are happy to have you on-board. Your login password is: ${pass}
			    	</mj-text>
			    </mj-section>
			    <mj-section>
			    	${pass}
			    </mj-section>
			  </mj-body>
			</mjml>
		`
	);
};

module.exports = password;