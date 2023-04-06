var enquiry = function(companyLogo, name, email, enquery) {
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
			    		Hi, you have an enquery from ${email} (${name}):
			    		<quote>${enquery}</quote>
			    	</mj-text>
			    </mj-section>
			  </mj-body>
			</mjml>
		`
	);
};

module.exports = enquiry;