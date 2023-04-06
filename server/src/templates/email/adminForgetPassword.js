var password = function(companyLogo, token) {
	console.log(companyLogo, token, "got in mail");
	
	return (
		`
			<mjml>
			  <mj-body>
			    <mj-section background-color="#f0f0f0">
			      <mj-column>
			        <mj-image width="200" src=${companyLogo} />
 			      </mj-column>
			    </mj-section>
			    <mj-section>
			    	<mj-text>
			    		Dear user,
			    	</mj-text>
                </mj-section>
                <mj-section>
			    	<mj-text>
			    		Kindly click the below button to set new password.
			    	</mj-text>
                </mj-section>
                <mj-button font-family="Helvetica" background-color="#f45e43" color="white" href=${token}>
                    Create Password!
                </mj-button>
			  </mj-body>
			</mjml>
		`
	);
};

module.exports = password;