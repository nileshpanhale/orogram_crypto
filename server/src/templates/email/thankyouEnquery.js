var thankyouEnquery = function(companyLogo) {
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
			    		Hi, thank you for your enquery. We will get back to you soon.
			    	</mj-text>
			    </mj-section>
			  </mj-body>
			</mjml>
		`
	);
};

module.exports = thankyouEnquery;