/***
 *
 * simple but not the best way
 *
 * 1. from client side sent information
 * 2. genarate token jwt.sign()
 * 3. on the client side set token to the localstorage.
 */
/***
 * 2..
 * using cookies
 *  1.set cors middleware to allow cookies for our client side
 *
 * 3..
 *
 * using http only cookies
 * 1. from client side send the information(email, better : fairbase aer auth token) to genarate token.
 * 2. on the server side, accepet user information and if needed validate it
 * 3. genarate token in the server side using secret and expirsIn
 *
 * 4...
 * set the cookies
 * 4. while calling the api tell to use withCredentials
 *   axios
          .post("http://localhost:3000/jwt", userData, {
            withCredentials: true,
          })
     or for fetch add oftion credentials:"include"

 * 5. in the cors setting set credentials and origin
           // middleware
       app.use(
          cors({
            origin: ["http://localhost:5173"],
            Credential: true,
              }),
             );
 *
 * 6. after the genarating the token set it to the cookies with some oftions
 *  // set token in the cookies
           res.cookie("token", token, {
             httpOnly: true,
             secure: false,
             sameSite: "lax",
           });
 *
 * 7. one time :use cookieParser as middleware
 * 8. for every api you want to varify token :in the client site : if using axios 
 *    withCredentials:true for fetch:credentials include
 * 
 *   varify token
 *  8. Check token exists. if not , return 401 --> unauthorized
 *  9. jwt.varify function. if error return 401 --> unauthorized
 *  10. if token is valid set the decoded value to the req object
 *  11. if data asking for doesn't match with the owner or bearer of the token
 *      --> 403 --> forbidden access
 */
